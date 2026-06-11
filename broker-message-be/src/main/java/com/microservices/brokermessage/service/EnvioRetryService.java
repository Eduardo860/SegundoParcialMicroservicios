package com.microservices.brokermessage.service;

import com.microservices.brokermessage.model.EnvioRetryJob;
import com.microservices.brokermessage.repository.EnvioRetryJobRepository;
import com.microservices.brokermessage.chain.envio.EnvioApiCallHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class EnvioRetryService {

    private static final Logger logger = LoggerFactory.getLogger(EnvioRetryService.class);

    private static final int MAX_ATTEMPTS = 5;

    @Autowired
    private EnvioRetryJobRepository envioRetryJobRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private EnvioApiCallHandler apiCallHandler;

    @Value("${notification.email.default-to}")
    private String notificationEmail;

    public EnvioRetryJob createJob(String envioId, String action, String requestData) {
        List<String> activeStatuses = Arrays.asList("SCHEDULED", "RUNNING");
        Optional<EnvioRetryJob> existingJob = envioRetryJobRepository.findByEnvioIdAndActionAndStatusIn(envioId, action, activeStatuses);

        if (existingJob.isPresent()) {
            logger.warn("EnvioRetryJob already exists for envioId={} action={} - Skipping duplicate. Existing job id={}", envioId, action, existingJob.get().getId());
            return existingJob.get();
        }

        EnvioRetryJob job = new EnvioRetryJob();
        job.setEnvioId(envioId);
        job.setAction(action);
        job.setRequestData(requestData);
        job.setStatus("SCHEDULED");
        job.setNextRunAt(OffsetDateTime.now());

        EnvioRetryJob savedJob = envioRetryJobRepository.save(job);
        logger.info("EnvioRetryJob created id={} envioId={} action={}", savedJob.getId(), envioId, action);
        return savedJob;
    }

    public List<EnvioRetryJob> getPendingJobs() {
        return envioRetryJobRepository.findByStatus("SCHEDULED");
    }

    public void processJob(EnvioRetryJob job) {
        if (job.getNextRunAt().isAfter(OffsetDateTime.now())) {
            return; 
        }

        job.setAttempt(job.getAttempt() + 1);
        job.setStatus("RUNNING");
        envioRetryJobRepository.save(job);

        logger.info("Executing EnvioRetryJob id={} attempt={}", job.getId(), job.getAttempt());

        try {
            boolean success = apiCallHandler.handle(job);
            
            if (success) {
                job.setStatus("SUCCESS");
                logger.info("EnvioRetryJob id={} completed successfully", job.getId());
            } else {
                handleFailure(job, "Unknown API failure");
            }
        } catch (Exception e) {
            handleFailure(job, e.getMessage());
        }

        envioRetryJobRepository.save(job);
    }

    private void handleFailure(EnvioRetryJob job, String errorMsg) {
        if (job.getAttempt() >= MAX_ATTEMPTS) {
            job.setStatus("FAILED");
            logger.warn("EnvioRetryJob id={} permanently FAILED after {} attempts", job.getId(), MAX_ATTEMPTS);
            emailService.sendFailureEmail(notificationEmail, job.getId().toString(), job.getEnvioId(), "ENVIO_" + job.getAction(), errorMsg);
        } else {
            job.setStatus("SCHEDULED");
            long delaySeconds = (long) Math.pow(2, job.getAttempt()) * 10;
            job.setNextRunAt(OffsetDateTime.now().plusSeconds(delaySeconds));
            logger.info("EnvioRetryJob id={} rescheduled in {}s (attempt {})", job.getId(), delaySeconds, job.getAttempt() + 1);
        }
    }
}
