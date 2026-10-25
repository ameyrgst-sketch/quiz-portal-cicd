FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} quiz-app.jar
EXPOSE 8090
ENTRYPOINT ["java", "-jar", "quiz-app.jar"]
