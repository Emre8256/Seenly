package com.seenly.backend.repository;

import com.seenly.backend.entity.FriendResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface FriendResponseRepository extends JpaRepository<FriendResponse, UUID> {
}
