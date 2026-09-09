package com.example.demo.controllers;

import com.example.demo.dto.DocumentResponseDTO;
import com.example.demo.entities.Document;
import com.example.demo.services.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/documenti")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentResponseDTO archivia(@RequestParam("file") MultipartFile file,
                                        @RequestParam(value = "titolo", required = false) String titolo) {
        return DocumentResponseDTO.from(service.archivia(file, titolo));
    }

    @GetMapping
    public List<DocumentResponseDTO> getAll() {
        return service.getAll().stream()
                .map(DocumentResponseDTO::from)
                .toList();
    }

    @GetMapping("/{id}")
    public DocumentResponseDTO getById(@PathVariable Long id) {
        return DocumentResponseDTO.from(service.getById(id));
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<byte[]> scaricaFile(@PathVariable Long id) {
        Document documento = service.getById(id);
        String tipo = documento.getTipoFile() != null
                ? documento.getTipoFile()
                : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + documento.getNomeFile() + "\"")
                .contentType(MediaType.parseMediaType(tipo))
                .body(documento.getContenutoFile());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void elimina(@PathVariable Long id) {
        service.elimina(id);
    }
}
