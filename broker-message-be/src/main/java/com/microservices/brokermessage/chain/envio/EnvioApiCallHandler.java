package com.microservices.brokermessage.chain.envio;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.microservices.brokermessage.model.EnvioRetryJob;
import com.microservices.brokermessage.service.EnvioService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class EnvioApiCallHandler {

    private static final Logger logger = LoggerFactory.getLogger(EnvioApiCallHandler.class);

    @Autowired
    private EnvioService envioService;

    @Autowired
    private ObjectMapper objectMapper;

    public boolean handle(EnvioRetryJob job) throws Exception {
        logger.info("EnvioApiCallHandler: action={} entityId={}", job.getAction(), job.getEnvioId());

        try {
            if ("CREATE".equalsIgnoreCase(job.getAction())) {
                Map<String, Object> data = objectMapper.readValue(job.getRequestData(), Map.class);
                String customerEmail = (String) data.get("customerEmail");
                
                if (customerEmail == null || customerEmail.isEmpty()) {
                    customerEmail = "default@example.com"; 
                }

                envioService.createEnvio(job.getEnvioId(), customerEmail);
                job.setResponseData("{\"status\": 200, \"message\": \"Envio created successfully\"}");
                return true;
            } else if ("UPDATE".equalsIgnoreCase(job.getAction())) {
                job.setResponseData("{\"status\": 200, \"message\": \"Update not implemented for envios\"}");
                return true;
            } else if ("DELETE".equalsIgnoreCase(job.getAction())) {
                job.setResponseData("{\"status\": 200, \"message\": \"Delete not implemented for envios\"}");
                return true;
            } else {
                throw new IllegalArgumentException("Unknown action: " + job.getAction());
            }
        } catch (Exception e) {
            logger.error("EnvioApiCallHandler: failed action={} error={}", job.getAction(), e.getMessage());
            throw e;
        }
    }
}
