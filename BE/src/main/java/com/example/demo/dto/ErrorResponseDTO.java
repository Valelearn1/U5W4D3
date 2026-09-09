package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class ErrorResponseDTO {

    private Instant timestamp;
    private int status;
    private String error;
    private String message;
}
