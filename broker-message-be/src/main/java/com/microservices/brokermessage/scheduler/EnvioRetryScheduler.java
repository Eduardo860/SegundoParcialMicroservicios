package com.microservices.brokermessage.scheduler;

import com.microservices.brokermessage.model.EnvioRetryJob;
import com.microservices.brokermessage.service.EnvioRetryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class EnvioRetryScheduler {

    private static final Logger logger = LoggerFactory.getLogger(EnvioRetryScheduler.class);

    @Autowired
    private EnvioRetryService envioRetryService;

    @Scheduled(fixedDelayString = "${retry.fixedDelay:20000}")
    public void processPendingJobs() {
        List<EnvioRetryJob> jobs = envioRetryService.getPendingJobs();
        if (!jobs.isEmpty()) {
            logger.info("EnvioRetryScheduler: processing {} scheduled job(s)", jobs.size());
            for (EnvioRetryJob job : jobs) {
                envioRetryService.processJob(job);
            }
        }
    }
}
