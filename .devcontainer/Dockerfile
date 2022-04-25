# Image for a Python 3 development environment
FROM node:12-alpine3.14

# Add any tools that are needed beyond Python 3.9
# RUN apk update && \
#     apk add -y sudo vim git zip tree curl wget jq && \
#     apk autoremove -y && \
#     apk clean -y

# # Create a user for development
# ARG USERNAME=devops
# ARG USER_UID=1000
# ARG USER_GID=$USER_UID

# # Create the user with passwordless sudo privileges
# RUN groupadd --gid $USER_GID $USERNAME \
#     && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME -s /bin/bash \
#     && usermod -aG sudo $USERNAME \
#     && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
#     && chmod 0440 /etc/sudoers.d/$USERNAME

# Set up the Python development environment
WORKDIR /app
RUN npm install -g truffle

# Enable color terminal for docker exec bash
ENV TERM=xterm-256color

EXPOSE 5000

# Become a regular user for development
# USER $USERNAME
