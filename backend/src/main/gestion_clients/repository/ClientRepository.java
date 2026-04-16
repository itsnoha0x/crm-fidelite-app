package com.crm.gestion_clients.repository;

import com.crm.gestion_clients.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClientRepository extends JpaRepository<Client, Long> {
}
