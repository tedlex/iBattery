# Macbook Battery Usage Visualization App

Keywords: electron, chartjs, crontab

This is a desktop app built on Electron. It reads from a csv file which records battery info every 3 minutes and visualize it using Chartjs. You can set a crontab task to record the data.


https://github.com/tedlex/iBattery/assets/41911311/d7a46b5a-074d-4e87-855c-9655f0436108



## Features:

1. Detailed information of battery percentage and consumption rate within recent 1-7 days
   ![Day](https://user-images.githubusercontent.com/41911311/265232252-d787cb71-abf5-4f58-a73f-ac335aa2b829.png)
   The blue points are battery percentages. The red areas are estimated consumption rates. The green areas are when the battery is charging or the computer is powered by AC adapter.

   The unit of consumption rate is percentage per hour. For example, if it is 12.5 %/h, then it means a full battery will last for 8 hours in this speed.

2. Daily information of working hours and average consumption rate of past 30 days.
   ![Month](https://user-images.githubusercontent.com/41911311/265232296-1a651fb2-911c-424d-9425-55612240c78e.png)

## Installation:

1. You can download the dmg in the releases on the right side of the page, or clone this project and build the electron app on your own.

## CSV File:

The script `record_battery.sh` in `sh_scripts` folder can write current battery info into a csv file:

```
path/to/record_battery.sh path/to/battery_records.csv
```

You can use `crontab` to run this script every 3 minutes (please don't chaneg this number).

1. download `record_battery.sh`
2. open a terminal window
3. run `crontab -e`
4. Add task `*/3 * * * * path/to/record_battery.sh path/to/batteru_records.csv`

If you don't know how to add crontab tasks, you can use the other script `add_crontab_task.sh` to help you:

1. download both `record_battery.sh` and `add_crontab_task.sh`
2. open a terminal window
3. run `path/to/add_crontab_task.sh`

## Notes

1. When you first open the app it will ask you the path of the csv file. You can also change it later:
   ![File](https://user-images.githubusercontent.com/41911311/265232971-e78200c1-02b4-47d3-a21a-3e9615498bde.png)

2. Please don't change 3 as it is meaningful in our data processing algorithms. You can change the variable `interval=3` in the orginal codes and rebuild the app if you want.

3. The crontab task will only run when the computer is awake. So when it is awake there will be a record every 3 minutes. We use this to decide if the computer is working or not.

4. The consumption rate is basically the slope of the percentage curve. It will only be estimated when the battery is discharging and also the computer is working.
