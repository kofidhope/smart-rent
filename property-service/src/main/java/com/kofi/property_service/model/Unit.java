package com.kofi.property_service.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "units")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Unit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Which property this unit belongs to
    // Many units → one property
    @ManyToOne
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    // "Whole House", "Room A1", "Apt 101"
    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    // NULL = use property price
    @Column(name = "price_override", precision = 10, scale = 2)
    private BigDecimal priceOverride;

    // NULL = use property bedrooms
    @Column(name = "bedrooms_override")
    private Integer bedroomsOverride;

    // NULL = use property bathrooms
    @Column(name = "bathrooms_override")
    private Integer bathroomsOverride;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PropertyStatus status = PropertyStatus.AVAILABLE;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at",
            updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Convenience methods ───────────────────────────

    // Effective price — unit override takes priority
    // falls back to property price
    public BigDecimal getEffectivePrice() {
        return priceOverride != null ? priceOverride : property.getPrice();
    }

    // Effective bedrooms
    public int getEffectiveBedrooms() {
        return bedroomsOverride != null ? bedroomsOverride : property.getBedrooms();
    }

    // Effective bathrooms
    public int getEffectiveBathrooms() {
        return bathroomsOverride != null ? bathroomsOverride : property.getBathrooms();
    }

    public boolean isAvailable() {
        return status == PropertyStatus.AVAILABLE;
    }
}
