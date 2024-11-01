#!/bin/bash

MAX_RESTARTS=5
RESTART_DELAY=60
restart_count=0
last_restart_time=0

# Function to send email
send_email() {
    local exit_code=$1
    local error_message=$2
    node -e "
    const { sendEmail } = require('./server-app/utils/sendEmail');
    sendEmail(
        'admin@example.com',
        'Server Crash Notification',
        \`The server has crashed.
        Exit Code: ${exit_code}
        Error Message: ${error_message}
        Restart Count: ${restart_count}/${MAX_RESTARTS}\`
    );
    "
}

# Function to check and reset restart counter
check_restart_counter() {
    current_time=$(date +%s)
    time_diff=$((current_time - last_restart_time))
    
    if [ $time_diff -gt 60 ] && [ $restart_count -gt 0 ]; then
        echo "More than 60 seconds since last restart. Resetting restart counter."
        restart_count=0
    fi
    last_restart_time=$current_time
}

# Loop to restart the server
while [ $restart_count -lt $MAX_RESTARTS ]; do
    node server.js &
    server_pid=$!

    # Wait for the server to exit
    wait $server_pid
    exit_code=$?

    if [ $exit_code -ne 0 ]; then
        # Проверяем и обнуляем счетчик если прошло больше 60 секунд
        check_restart_counter
        
        restart_count=$((restart_count + 1))
        echo "Server crashed with exit code $exit_code. Restart attempt $restart_count of $MAX_RESTARTS."
        error_message=$(tail -n 1 /tmp/server_error.log)
        send_email "$exit_code" "$error_message"
        
        if [ $restart_count -lt $MAX_RESTARTS ]; then
            echo "Waiting for $RESTART_DELAY seconds before restarting..."
            sleep $RESTART_DELAY
        else
            echo "Maximum restart attempts reached. Exiting."
            send_email "$exit_code" "Maximum restart attempts reached. Server will not be restarted automatically."
            break
        fi
    else
        echo "Server stopped normally. Exiting."
        break
    fi
done

if [ $restart_count -eq $MAX_RESTARTS ]; then
    echo "Server repeatedly crashed. Please check the logs and resolve the issue."
    echo "You can manually restart the container once the issue is resolved."
fi
