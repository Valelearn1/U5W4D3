package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Il browser applica la "same-origin policy": una pagina servita da localhost:5173
 * non puo' chiamare localhost:8080 (porta diversa = origine diversa) se il server
 * non risponde con gli header CORS che autorizzano quell'origine.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173", "http://127.0.0.1:5173")
                .allowedMethods("GET", "POST", "DELETE")
                .allowedHeaders("*");
    }
}
