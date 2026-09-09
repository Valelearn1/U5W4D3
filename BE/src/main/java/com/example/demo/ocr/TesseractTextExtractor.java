package com.example.demo.ocr;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import javax.imageio.ImageIO;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

/**
 * L'adattatore vero. E' l'unico file del progetto che nomina Tesseract.
 */
@Component
class TesseractTextExtractor implements TextExtractor {

    private static final Logger log = LoggerFactory.getLogger(TesseractTextExtractor.class);

    /** Un PDF inizia sempre con i byte "%PDF": e' la sua "firma" (magic number). */
    private static final byte[] FIRMA_PDF = {'%', 'P', 'D', 'F'};

    /** Risoluzione con cui le pagine PDF vengono trasformate in immagini: sotto i 300 DPI l'OCR sbaglia molto. */
    private static final float PDF_DPI = 300f;

    /** Limite di sicurezza: un PDF di 500 pagine bloccherebbe la richiesta per minuti. */
    private static final int MAX_PAGINE = 20;

    /** Chiede una nuova istanza (scope prototype) a ogni chiamata: l'oggetto non e' thread-safe. */
    private final ObjectProvider<Tesseract> tesseractProvider;

    TesseractTextExtractor(ObjectProvider<Tesseract> tesseractProvider) {
        this.tesseractProvider = tesseractProvider;
    }

    @Override
    public ExtractedText extract(byte[] file) {
        long start = System.currentTimeMillis();
        Tesseract tesseract = tesseractProvider.getObject();
        try {
            String text = isPdf(file)
                    ? estraiDaPdf(tesseract, file)
                    : tesseract.doOCR(decode(file));
            long millis = System.currentTimeMillis() - start;
            log.info("OCR completato in {} ms, {} caratteri", millis, text.length());
            return new ExtractedText(text.strip(), millis);
        } catch (TesseractException e) {
            // L'eccezione della libreria viene tradotta in un'eccezione del nostro dominio.
            throw new OcrException("Tesseract non e' riuscito a leggere il documento", e);
        } catch (IllegalArgumentException | UnsatisfiedLinkError | NoClassDefFoundError e) {
            // Tesseract non installato, oppure percorso tessdata sbagliato: fuori esce
            // sempre un errore di dominio, mai un problema della libreria nativa.
            throw new OcrException("Tesseract non disponibile: " + e.getMessage(), e);
        }
    }

    /** Riconosce un PDF dai suoi primi byte, non dal nome del file (che l'utente puo' rinominare). */
    private boolean isPdf(byte[] file) {
        if (file.length < FIRMA_PDF.length) {
            return false;
        }
        for (int i = 0; i < FIRMA_PDF.length; i++) {
            if (file[i] != FIRMA_PDF[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Tesseract lavora solo su immagini: PDFBox disegna ogni pagina del PDF su un
     * BufferedImage in scala di grigi, poi passiamo quell'immagine all'OCR.
     */
    private String estraiDaPdf(Tesseract tesseract, byte[] pdf) throws TesseractException {
        try (PDDocument documento = Loader.loadPDF(pdf)) {
            PDFRenderer renderer = new PDFRenderer(documento);
            int pagine = Math.min(documento.getNumberOfPages(), MAX_PAGINE);
            if (pagine == 0) {
                throw new OcrException("Il PDF non contiene pagine", null);
            }
            StringBuilder testo = new StringBuilder();
            for (int i = 0; i < pagine; i++) {
                if (pagine > 1) {
                    testo.append("--- Pagina ").append(i + 1).append(" ---\n");
                }
                BufferedImage pagina = renderer.renderImageWithDPI(i, PDF_DPI, ImageType.GRAY);
                testo.append(tesseract.doOCR(pagina)).append('\n');
            }
            if (documento.getNumberOfPages() > MAX_PAGINE) {
                testo.append("\n[Lette solo le prime ").append(MAX_PAGINE).append(" pagine su ")
                        .append(documento.getNumberOfPages()).append("]");
            }
            return testo.toString();
        } catch (IOException e) {
            throw new OcrException("PDF illeggibile o protetto da password", e);
        }
    }

    private BufferedImage decode(byte[] image) {
        try {
            BufferedImage decoded = ImageIO.read(new ByteArrayInputStream(image));
            if (decoded == null) {
                throw new OcrException("Formato immagine non riconosciuto", null);
            }
            return decoded;
        } catch (IOException e) {
            throw new OcrException("Immagine illeggibile", e);
        }
    }
}
