package com.example.demo.ocr;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ocr")
public record OcrProperties(

        /** Cartella che contiene i file .traineddata. */
        String tessdataPath,

        /** Lingue usate dall'OCR: "ita+eng" per italiano e inglese insieme. */
        String language) {
}
