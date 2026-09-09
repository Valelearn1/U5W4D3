package com.example.demo.services;

import com.example.demo.entities.Document;
import com.example.demo.exceptions.DocumentNotFoundException;
import com.example.demo.ocr.ExtractedText;
import com.example.demo.ocr.TextExtractor;
import com.example.demo.repositories.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DocumentService {

    /** Gli unici tipi che Tesseract (con l'aiuto di PDFBox) sa davvero leggere. */
    private static final Set<String> TIPI_AMMESSI = Set.of(
            "image/jpeg", "image/png", "image/tiff", "image/bmp", "image/gif",
            "image/webp", "application/pdf");

    private final DocumentRepository repository;
    private final TextExtractor textExtractor;

    public Document archivia(MultipartFile file, String titolo) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Il file è obbligatorio");
        }
        String tipo = file.getContentType();
        if (tipo == null || !TIPI_AMMESSI.contains(tipo.toLowerCase())) {
            // Meglio un 400 chiaro subito che un errore incomprensibile dentro l'OCR.
            throw new IllegalArgumentException(
                    "Tipo di file non supportato: " + tipo + ". Ammessi: immagini e PDF.");
        }
        try {
            byte[] contenuto = file.getBytes();
            ExtractedText estratto = textExtractor.extract(contenuto);

            Document documento = new Document();
            documento.setTitolo(titoloEffettivo(titolo, file));
            documento.setContenutoFile(contenuto);
            documento.setNomeFile(nomeEffettivo(file));
            documento.setTipoFile(tipo);
            documento.setDimensioneByte(file.getSize());
            documento.setTestoEstratto(estratto.text());
            documento.setOcrMillis(estratto.millis());
            return repository.save(documento);
        } catch (IOException e) {
            throw new IllegalStateException("Impossibile leggere il file caricato", e);
        }
    }

    /** Una foto scattata dalla fotocamera non ha un titolo naturale: ripieghiamo sul nome del file. */
    private String titoloEffettivo(String titolo, MultipartFile file) {
        if (titolo != null && !titolo.isBlank()) {
            return titolo.strip();
        }
        return nomeEffettivo(file);
    }

    private String nomeEffettivo(MultipartFile file) {
        String nome = file.getOriginalFilename();
        return (nome == null || nome.isBlank()) ? "documento" : nome;
    }

    public List<Document> getAll() {
        return repository.findAll();
    }

    public Document getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));
    }

    public void elimina(Long id) {
        if (!repository.existsById(id)) {
            throw new DocumentNotFoundException(id);
        }
        repository.deleteById(id);
    }
}
