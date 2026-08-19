# ── Stage 1: Build ────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Kopiuj Maven wrapper i pom.xml osobno (cache warstw Docker)
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN sed -i 's/\r//' mvnw && chmod +x mvnw

# Pobierz zależności (cachowane jeśli pom.xml się nie zmieni)
RUN ./mvnw dependency:go-offline -B

# Kopiuj źródła i buduj
COPY src ./src
RUN ./mvnw package -DskipTests -B

# ── Stage 2: Runtime ──────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Kopiuj JAR z etapu budowania
COPY --from=builder /app/target/*.jar app.jar

# Skrypt startowy
COPY entrypoint.sh .
RUN sed -i 's/\r//' entrypoint.sh && chmod +x entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
