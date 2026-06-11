package com.microservices.brokermessage.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.microservices.brokermessage.dto.KafkaMessageDto;
import com.microservices.brokermessage.service.EnvioRetryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class EnvioKafkaListener {

    private static final Logger logger = LoggerFactory.getLogger(EnvioKafkaListener.class);

    @Autowired
    private EnvioRetryService envioRetryService;

    @Autowired
    private ObjectMapper objectMapper;

    @KafkaListener(topics = "envios_retry_jobs", groupId = "envios-retry-group")
    public void consumeEnvioRetryEvent(KafkaMessageDto message) {
        logger.info("Kafka [envios_retry_jobs] received: entityId={} action={}", message.getEntityId(), message.getAction());
        try {
            String requestData = message.getRequestData() != null ? objectMapper.writeValueAsString(message.getRequestData()) : "{}";
            envioRetryService.createJob(message.getEntityId(), message.getAction(), requestData);
        } catch (Exception e) {
            logger.error("Failed to process envios_retry_jobs message: {}", e.getMessage(), e);
        }
    }
}
