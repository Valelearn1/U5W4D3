package com.example.demo.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "documenti")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titolo;

    @Column(name = "contenuto_file", columnDefinition = "bytea", nullable = false)
    private byte[] contenutoFile;

    @Column(name = "nome_file", nullable = false)
    private String nomeFile;

    @Column(name = "tipo_file", nullable = false)
    private String tipoFile;

    @Column(name = "dimensione_byte", nullable = false)
    private long dimensioneByte;

    /** columnDefinition = "text" perche' il testo di un documento supera i 255 caratteri di default. */
    @Column(name = "testo_estratto", columnDefinition = "text")
    private String testoEstratto;

    /** Quanto ha impiegato l'OCR: utile per capire se conviene passare a un'elaborazione asincrona. */
    @Column(name = "ocr_millis")
    private Long ocrMillis;

    @CreationTimestamp
    @Column(name = "creato_il", nullable = false, updatable = false)
    private Instant creatoIl;
}
