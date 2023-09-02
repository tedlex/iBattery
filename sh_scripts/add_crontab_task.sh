#!/bin/bash

# Check if record_battery.sh already exists in crontab
if crontab -l | grep -q "record_battery.sh"; then
  echo "record_battery.sh task already exists in crontab."
  exit 0
fi

# Ask user for the path to record_battery.sh
read -p "Please enter the full path to record_battery.sh: " script_path

# Validate that the path exists
if [ ! -f "$script_path" ]; then
  echo "File not found. Exiting."
  exit 1
fi

# Extract the directory from the script path
script_dir=$(dirname "$script_path")

# Build the default output path
default_output_path="$script_dir/battery_records.csv"

# Ask user for the path to store CSV
read -p "Would you like to output the CSV file to '$default_output_path'? (y/n): " use_default
if [ "$use_default" = "y" ]; then
  output_path="$default_output_path"
else
  while true; do
    read -p "Please enter the full path to the output CSV file: " output_path
    if [[ "$output_path" == *.csv ]]; then
      break
    else
      echo "Please make sure the output path ends with '.csv'"
    fi
  done
fi

# Add to crontab
cron_entry="*/3 * * * * $script_path $output_path"
(crontab -l; echo "$cron_entry") | crontab -

echo "Crontab entry added."
