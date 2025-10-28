# Development Container for Chainlit ADK WYSIWYG
# Optimized for VS Code DevContainers with hot-reload support

ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine

# Install system dependencies
RUN apk add --no-cache \
    # Python and build tools
    python3 \
    py3-pip \
    python3-dev \
    build-base \
    gcc \
    musl-dev \
    libffi-dev \
    openssl-dev \
    # Development tools
    git \
    vim \
    curl \
    wget \
    bash \
    sudo \
    # Process management
    procps \
    && ln -sf python3 /usr/bin/python

# Create a non-root user with sudo access
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Ensure node user exists with correct UID/GID
RUN if [ "$USER_UID" != "1000" ] || [ "$USER_GID" != "1000" ]; then \
        deluser node && \
        addgroup -g $USER_GID $USERNAME && \
        adduser -D -u $USER_UID -G $USERNAME -s /bin/bash $USERNAME; \
    fi \
    && echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# Set working directory
WORKDIR /workspace

# Configure command history persistence
RUN SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
    && mkdir /commandhistory \
    && touch /commandhistory/.bash_history \
    && chown -R $USERNAME:$USERNAME /commandhistory \
    && echo "$SNIPPET" >> "/home/$USERNAME/.bashrc"

# Install global npm packages for development
RUN npm install -g \
    npm@latest \
    typescript \
    tsx \
    nodemon

# Switch to non-root user
USER $USERNAME

# Create Python virtual environment directory
RUN mkdir -p /workspace/chainlit_app && \
    python3 -m venv /workspace/chainlit_app/.venv

# Set up PATH to include Python venv
ENV PATH="/workspace/chainlit_app/.venv/bin:${PATH}"

# Install Python development tools in the venv
RUN /workspace/chainlit_app/.venv/bin/pip install --no-cache-dir --upgrade pip && \
    /workspace/chainlit_app/.venv/bin/pip install --no-cache-dir \
    black \
    flake8 \
    pylint \
    pytest

# Configure git to trust the workspace directory
RUN git config --global --add safe.directory /workspace

# Set default shell to bash
SHELL ["/bin/bash", "-c"]

# Expose ports
EXPOSE 3000 3001 8000

# Default command (will be overridden by docker-compose)
CMD ["sleep", "infinity"]
