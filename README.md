Commandline interface for jabber 

# Usage:

````
jstalk -u user@gmail.com -s talk.google.com -p 5222
````

## Commands:

 * set status away|dnd|online
 * roster
 * [Esc] clear input line

## Chat:

Type jabber id (complete with tab) and type message

# Jabber Features:

 * Jabber Messages
 * Jabber Presence
 * Jabber Roster
 * GMail notify (if server supports it)

# Installation
 
## Windows
 
Install Microsoft Windows SDK (msbuild) and node
http://www.microsoft.com/en-us/download/details.aspx?id=8279
 
Specify the Platform Toolset
 
x86:
````
call "C:\Program Files\Microsoft SDKs\Windows\v7.1\bin\Setenv.cmd" /Release /x86
````
 
x64:
````
call "C:\Program Files\Microsoft SDKs\Windows\v7.1\bin\Setenv.cmd" /Release /x64
````

install jstalk
````
npm install https://github.com/kosmobot/jstalk.git -g
````
