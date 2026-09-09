package com.example.demo.dto;

import com.example.demo.entities.Document;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class DocumentResponseDTO {

    private Long id;
    private String titolo;
    private String nomeFile;
    private String tipoFile;
    private long dimensioneByte;
    private Instant creatoIl;

    public static DocumentResponseDTO from(Document documento) {
        return new DocumentResponseDTO(
                documento.getId(),
                documento.getTitolo(),
                documento.getNomeFile(),
                documento.getTipoFile(),
                documento.getDimensioneByte(),
                documento.getCreatoIl()
        );
    }
}
