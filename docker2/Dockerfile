# Use the latest version of Kali Linux
FROM kalilinux/kali-rolling

# Update and install necessary packages for pentesting
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    openssh-server \
    sudo \
    nmap \
    metasploit-framework \
    hydra \
    john \
    wireshark \
    netcat-openbsd \
    aircrack-ng \
    sqlmap \
    dirbuster \
    nikto \
    zaproxy \
    && rm -rf /var/lib/apt/lists/*

# Set up SSH
RUN mkdir -p /var/run/sshd && \
    echo 'root:toor' | chpasswd && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

# Create and activate Python virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV

# Copy initial .bashrc with virtual environment activation to a temporary location
COPY .bashrc /etc/skel/.bashrc

# Copy the script to ensure .bashrc is in the root directory
COPY initialize.sh /usr/local/bin/initialize.sh
RUN chmod +x /usr/local/bin/initialize.sh

# Ensure the virtual environment and pip setup
RUN $VIRTUAL_ENV/bin/pip install --upgrade pip

# Expose SSH port
EXPOSE 22

# Init .bashrc
CMD ["/usr/local/bin/initialize.sh"]