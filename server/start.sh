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

# Maximum number of restart attempts
MAX_RESTARTS=5

# Current restart count
restart_count=0

while true; do
    # Capture both stdout and stderr
    output=$(node server.js 2>&1)
    exit_code=$?

    if [ $exit_code -ne 0 ]; then
        echo "Server crashed with exit code $exit_code. Restarting..."
        
        # Get the last line of output as the error message
        error_message=$(echo "$output" | tail -n 1)
        
        send_email "$exit_code" "$error_message"
        
        # Increment restart count
        ((restart_count++))
        
        if [ $restart_count -ge $MAX_RESTARTS ]; then
            echo "Max restarts reached. Exiting."
            break
        fi
        
        sleep 60  # Increased sleep interval to reduce load
    else
        echo "Server stopped normally. Exiting."
        break
    fi
    
    # Log the restart attempt
    echo "$(date) Server restarted ($restart_count/$MAX_RESTARTS)" >> server_restarts.log
done
