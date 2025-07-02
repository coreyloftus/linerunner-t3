# LineRunner T3

an app by Corey Loftus

## Purpose

## Functionality

## To Dos

### AI connection to translate raw text into JSON format

Page with a text input that allows users to paste in a script in a raw text format, and the AI call will transform it into the JSON format the app consumes.

### User Logins

Build out login page.
Enable SSO for Apple, Google.
NextAuth?

### Shared records & separate Database for each user

Connect a database solution to allow users to upload and save their own scripts to the platform.
Users can have access to all shared public scripts (Shakespeare, etc).

### Allow users to live edit a scene

Add a tab to the top of the ScriptBox which allows a user to view the live JSON for the current scene.
If a user does edit the scene JSON, the ScriptBox will read from this live edited scene JSON.

### User Inputted Scenes

A new component that will work in this way:

- a user can input new text
- a user will have an input box for character names separated by commas (this field is used to more easily be able to parse the character names out of the input script)
- transform the new text into the correct schema to be read by the ScriptBox as a new script.
