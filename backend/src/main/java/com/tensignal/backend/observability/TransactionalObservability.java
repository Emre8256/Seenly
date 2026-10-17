package com.tensignal.backend.observability;

import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
public class TransactionalObservability {
    public void afterCommit(Runnable event) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            event.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                event.run();
            }
        });
    }
}
