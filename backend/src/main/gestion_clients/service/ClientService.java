package com.crm.gestion_clients.service;

import com.crm.gestion_clients.model.Client;
import com.crm.gestion_clients.repository.ClientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClientService {

    @Autowired
    private ClientRepository clientRepository;

    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    public Client getClientById(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));
    }

    public Client createClient(Client client) {
        return clientRepository.save(client);
    }

    public Client updateClient(Long id, Client client) {
        Client existing = getClientById(id);
        existing.setPrenom(client.getPrenom());
        existing.setNom(client.getNom());
        existing.setEmail(client.getEmail());
        existing.setTelephone(client.getTelephone());
        existing.setAdresse(client.getAdresse());
        existing.setSegment(client.getSegment());
        return clientRepository.save(existing);
    }

    public List<Client> searchClients(String q) {
        return clientRepository.findAll().stream()
                .filter(c -> c.getNom().toLowerCase().contains(q.toLowerCase())
                        || c.getEmail().toLowerCase().contains(q.toLowerCase()))
                .toList();
    }

    public void deleteClient(Long id) {
        // deleteById de JPA ne lève pas d'exception si l'ID n'existe pas
        // On force une vérification explicite
        if (!clientRepository.existsById(id)) {
            throw new RuntimeException("Client introuvable avec l'id : " + id);
        }
        clientRepository.deleteById(id);
    }


}