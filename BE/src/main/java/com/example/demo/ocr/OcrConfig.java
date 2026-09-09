package com.example.demo.ocr;

import net.sourceforge.tess4j.Tesseract;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.config.ConfigurableBeanFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

@Configuration
@EnableConfigurationProperties(OcrProperties.class)
class OcrConfig {

    private static final Logger log = LoggerFactory.getLogger(OcrConfig.class);

    /**
     * Tesseract non e' scritto in Java: e' una libreria C che tess4j richiama tramite JNA.
     * JNA cerca il file libtesseract.dylib (o .so / .dll) in una lista di cartelle di
     * sistema, e su Mac con Homebrew NON e' tra quelle. Il risultato sarebbe:
     *
     *     UnsatisfiedLinkError: Unable to load library 'tesseract'
     *
     * La property jna.library.path aggiunge la cartella giusta a quella lista. Va impostata
     * PRIMA che la libreria venga caricata: il costruttore della configurazione viene
     * eseguito all'avvio del contesto Spring, quindi molto prima della prima richiesta OCR.
     */
    OcrConfig(OcrProperties properties) {
        String percorso = properties.nativeLibPath();
        if (percorso != null && !percorso.isBlank()) {
            System.setProperty("jna.library.path", percorso);
            log.info("Librerie native OCR cercate in {}", percorso);
        }
    }

    /**
     * Un'istanza di Tesseract NON e' utilizzabile da piu' thread contemporaneamente:
     * con lo scope prototype ne otteniamo una nuova a ogni richiesta.
     */
    @Bean
    @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
    Tesseract tesseract(OcrProperties properties) {
        var tesseract = new Tesseract();
        tesseract.setDatapath(properties.tessdataPath());
        tesseract.setLanguage(properties.language());
        return tesseract;
    }
}
