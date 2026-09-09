package com.example.demo.exceptions;

public class DocumentNotFoundException extends RuntimeException {

    public DocumentNotFoundException(Long id) {
        super("Documento non trovato con id " + id);
    }
}
