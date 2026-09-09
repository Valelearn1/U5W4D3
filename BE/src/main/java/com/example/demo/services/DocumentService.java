package com.example.demo.services;

import com.example.demo.entities.Document;
import com.example.demo.exceptions.DocumentNotFoundException;
import com.example.demo.repositories.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository repository;

    public Document archivia(MultipartFile file, String titolo) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Il file è obbligatorio");
        }
        try {
            Document documento = new Document();
            documento.setTitolo(titolo);
            documento.setContenutoFile(file.getBytes());
            documento.setNomeFile(file.getOriginalFilename());
            documento.setTipoFile(file.getContentType());
            documento.setDimensioneByte(file.getSize());
            return repository.save(documento);
        } catch (IOException e) {
            throw new IllegalStateException("Impossibile leggere il file caricato", e);
        }
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
