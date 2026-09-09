package com.example.demo.ocr;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ocr")
public record OcrProperties(

        /** Cartella che contiene i file .traineddata. */
        String tessdataPath,

        /** Lingue usate dall'OCR: "ita+eng" per italiano e inglese insieme. */
        String language,

        /**
         * Cartella delle librerie native (libtesseract.dylib / .so / .dll).
         * Serve perche' tess4j include le native precompilate solo per alcune piattaforme:
         * su Mac ARM va indicata la cartella di Homebrew. Se vuota, JNA usa i suoi percorsi
         * di default (utile su Linux, dove le librerie stanno gia' in /usr/lib).
         */
        String nativeLibPath) {
}
