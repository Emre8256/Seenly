FROM eclipse-temurin:17-jre-jammy AS runtime
RUN apt-get update \
    && apt-get install --no-install-recommends -y curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 10001 tensignal \
    && useradd --system --uid 10001 --gid tensignal --no-create-home tensignal
WORKDIR /app
ARG JAR_FILE=target/backend-0.0.1-SNAPSHOT.jar
COPY --chown=tensignal:tensignal ${JAR_FILE} app.jar
USER 10001:10001
EXPOSE 8080 8081
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"
ENV SPRING_PROFILES_ACTIVE="prod"
ENV DEPLOYMENT_ENVIRONMENT="production"
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl --fail --silent http://127.0.0.1:8081/actuator/health/readiness || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
