FROM openjdk:17-jdk-slim
WORKDIR /app
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} quiz-app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "quiz-app.jar"]
