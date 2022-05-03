FROM node:12-alpine3.14

# Set up the Python development environment
WORKDIR /app
RUN npm install -g truffle

# Enable color terminal for docker exec bash
ENV TERM=xterm-256color

EXPOSE 7545 8545

