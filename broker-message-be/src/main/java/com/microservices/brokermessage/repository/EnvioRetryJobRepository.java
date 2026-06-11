package com.microservices.brokermessage.repository;

import com.microservices.brokermessage.model.EnvioRetryJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnvioRetryJobRepository extends JpaRepository<EnvioRetryJob, UUID> {
    List<EnvioRetryJob> findByStatus(String status);
    Optional<EnvioRetryJob> findByEnvioIdAndActionAndStatusIn(String envioId, String action, List<String> statuses);
}
