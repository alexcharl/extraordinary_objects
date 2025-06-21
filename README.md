#> Start Here

##We use grunt

### To run browser watch: `$ grunt`

### To compile everything: `$ grunt c`

### Script files are multiple, and all in the scripts/ folder

<<<<<<< Updated upstream
### Check MAMP aliases to trigger correct multi-environment configs

### In order to make mysql commands available to mysql grunt task, run this line in terminal (whre path points to your local MAMP bin folder) 

`export PATH=$PATH:/Applications/MAMP/Library/bin`

=======
### Set Mamp alias to be: headway.craft.dev

### Making MySQL commands available to the Grunt MySQL dump task

In order to make mysql commands available to mysql grunt task your PATH directory needs to include the relevant MySQL commands. One way of doing this is pointing your Path to the MAMP library during the terminal session with this command:

`export PATH=$PATH:/Applications/MAMP/Library/bin`

Or a more permanent solution would be to create symlinks to the the MAMP `Library/bin/` executables from where your PATH directory is. [See this StackOverlow answer](http://stackoverflow.com/questions/17664021/mysql-command-not-found-mamp) for further info.



>>>>>>> Stashed changes
### Should be added to bash_profile to avoid having to enter this each time. More info here http://www.webbykat.com/2012/06/solving-sh-mysql-command-not-found-mamp-pro-2