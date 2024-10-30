#!/bin/bash

# Function to send email
send_email() {
    local exit_code=$1
    local error_message=$2
    node -e "
    const { sendEmail } = require('./server-app/utils/sendEmail');
    sendEmail(
        'admin@example.com',
        'Server Crash Notification',
        \`The server has crashed and is being restarted.
        Exit Code: ${exit_code}
        Error Message: ${error_message}\`
    );
    "
}

# Loop to restart the server
while true; do
    node server.js &
    server_pid=$!

    # Wait for the server to exit
    wait $server_pid
    exit_code=$?

    if [ $exit_code -ne 0 ]; then
        echo "Server crashed with exit code $exit_code. Restarting..."
        error_message=$(tail -n 1 /tmp/server_error.log)
        send_email "$exit_code" "$error_message"
        echo "" > /tmp/server_error.log  # Clear the error log
    else
        echo "Server stopped normally. Exiting."
        break
    fi

    sleep 5
done
