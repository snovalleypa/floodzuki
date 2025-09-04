# Running on Windows/WSL2

This document describes a way to get the Android app running in both
an emulator and an attached device, using Windows 11 and WSL2.  It is
accurate as of 9/2025.

## WSL Setup

In order to avoid using the expo "--tunnel" feature, WSL needs to be running
in the "mirrored" networking mode, with "host address loopback" turned on.  To do this,
create a file called .wslconfig in your %USERPROFILE% directory on Windows, with these contents:

```
[wsl2]
networkingMode=mirrored
[experimental]
hostAddressLoopback=true
```

Restart WSL (either with wsl --shutdown or by rebooting Windows).

## Android Studio setup

The easiest way to do this is to install Android Studio on BOTH Windows and WSL.

### Windows Android Studio setup

Install as per the official directions, then install the Android Command-line Tools:

In the "Settings" dialog, choose 
* Languages & Frameworks > Android SDK > SDK Tools

Check the box for "Android SDK Command-line Tools" and Apply.

You will be running the Android emulator in the Windows version of Android Studio.  
Launch the Virtual Device Manager and create and start whichever emulator(s) you need.

### WSL Android Studio setup:

```
sudo snap install android-studio --classic
```

You will also need to install the Android Command-line tools in WSL.

After this, you will want to make sure that the WSL "adb" command actually runs the
Windows version of ADB.  One way to do this is with a bash alias:

```
alias adb="/mnt/C/path-to-android-sdk/android-sdk/platform-tools/adb.exe"
```

You will also need to make sure that you have a JDK in your WSL installation.  The easiest way is:

```
sudo apt install openjdk-21-jdk
```

## Expo Orbit

NOTE: I am not sure if this is necessary.  Install Expo Orbit in Windows, and use it to install Expo Go 
on any physical devices and/or emulators you will be using.  See [Expo Go](https://expo.dev/go) for more information.


## Setup and run

You will be running all of the expo build/run/debugging in WSL.  Clone this repo there.

Create a .env file.  For official settings, talk to the SVPA Floodzilla team for access to API keys etc.

You will also need to download the google-services.json file from Firebase.  The SVPA Floodzilla team can help with this as well.

Now, when you're ready to run, verify that "adb devices" in WSL shows whatever devices you want to run on.

Then:

```
yarn install
npx expo install expo-dev-client
npx expo start
```

To do a full Android build and verify that that process is working, you can do:
```
npx expo run:android
```

