
/*
  FTUX: First Time User Experience
  This is to help with the empty state of the app on first use
  or when you just have 0 projects.
*/

(function(){

    var fs = require('fs-extra');
    var path = require('path');

    // Show FTUX view | Hide Sidebar | Hide Project Settings
    function loadFTUX () {
        var width = $("#sidebar").css("width");
        //Hide everything!
        $("#sidebar").css("left", "-" + width);
        $("#project-settings, #printConsoleTitle, #printConsole .alert, #printConsole .panel").fadeOut();
        $("#viewStatusNav").addClass("hide");
        //Show FTUX
        $("#ftux").fadeIn("slow");
    }

    // Hide FTUX view | Show Sidebar | Show Project Settings
    function unloadFTUX () {
        //Hide FTUX
        $("#ftux").fadeOut();
        //Show everything!
        $("#sidebar").css("left", "0px");
        $("#project-settings, #printConsoleTitle, #printConsole .alert, #printConsole .panel").fadeIn();
        $("#viewStatusNav").removeClass("hide");
    }

    /**
     * Checks the user profile, my docs, and root of some
     * drives (on Windows) for projects/GitHub folder.
     */
    function autoGuessProjectsFolder () {
        var projectsFolder = '';
        var tempProjectsFolder = '';
        var autoProjects = [ 'github', 'projects', 'repositories', 'repos', 'websites' ];

        //Set default paths to check based on OS standards
        var homePath = '';
        if (process.platform == 'linux') {
            homePath = process.env.HOME;
        } else if (process.platform == 'win32') {
            homePath = process.env.USERPROFILE;
        } else if (process.platform == 'darwin') {
            homePath = '/Users/' + process.env.USER;
        }
        var myDocsPath = path.join(homePath, 'Documents');
        var myDesktopPath = path.join(homePath, 'Desktop');

        if (homePath) {
            //Check the user profile for common project folders
            var contents = ugui.helpers.readAFolder(homePath);
            for (var i = 0; i < contents.length; i++) {
                for (var j = 0; j < autoProjects.length; j++) {
                    if (contents[i].name.toLowerCase() == autoProjects[j]) {
                        tempProjectsFolder = homePath.split('\\').join('/') + '/' + contents[i].name;
                        var innerContents = ugui.helpers.readAFolder(tempProjectsFolder);
                        //make sure there is at least one project folder in the projects folder
                        for (var k = 0; k < innerContents.length; k++) {
                            if (innerContents.length > 0 && innerContents[k].isFolder) {
                                projectsFolder = tempProjectsFolder;
                                scout.ftux.projectsFolder = projectsFolder;
                                return;
                            }
                        }
                    }
                }
            }
        }
        //then look in My Docs if it isn't in the user profile
        if (!projectsFolder && myDocsPath) {
            var myDocsContents = ugui.helpers.readAFolder(myDocsPath);
            for (var i = 0; i < myDocsContents.length; i++) {
                for (var j = 0; j < autoProjects.length; j++) {
                    if (myDocsContents[i].name.toLowerCase() == autoProjects[j]) {
                        tempProjectsFolder = myDocsPath.split('\\').join('/') + '/' + myDocsContents[i].name;
                        var innerContents = ugui.helpers.readAFolder(tempProjectsFolder);
                        //make sure there is at least one project folder in the projects folder
                        for (var k = 0; k < innerContents.length; k++) {
                            if (innerContents.length > 0 && innerContents[k].isFolder) {
                                projectsFolder = tempProjectsFolder;
                                scout.ftux.projectsFolder = projectsFolder;
                                return;
                            }
                        }
                    }
                }
            }
        }
        //then look on the Desktop if it isn't in the My Documents folder
        if (!projectsFolder && myDesktopPath) {
            var myDesktopContents = ugui.helpers.readAFolder(myDesktopPath);
            for (var i = 0; i < myDesktopContents.length; i++) {
                for (var j = 0; j < autoProjects.length; j++) {
                    if (myDesktopContents[i].name.toLowerCase() == autoProjects[j]) {
                        tempProjectsFolder = myDesktopPath.split('\\').join('/') + '/' + myDesktopContents[i].name;
                        var innerContents = ugui.helpers.readAFolder(tempProjectsFolder);
                        //make sure there is at least one project folder in the projects folder
                        for (var k = 0; k < innerContents.length; k++) {
                            if (innerContents.length > 0 && innerContents[k].isFolder) {
                                projectsFolder = tempProjectsFolder;
                                scout.ftux.projectsFolder = projectsFolder;
                                return;
                            }
                        }
                    }
                }
            }
        }
        //If on Window and no project folder was found in Docs or User, check drive roots (slow)
        if (!projectsFolder && process.platform == 'win32') {
            //Each drive letter adds like half a second to load time, so I limited them to the common ones
            var driveLetters = ['C', 'D', 'E', 'F', 'Z', 'Y', 'X', 'G', 'H', 'M', 'N',];
            var shortProjects = ['GitHub', 'Projects'];
            var stats = '';
            for (var i = 0; i < driveLetters.length; i++) {
                for (var j = 0; j < shortProjects.length; j++) {
                    var driveAndFolder = driveLetters[i] + ':/' + shortProjects[j];
                    try {
                        stats = fs.lstatSync(driveAndFolder);
                        if (stats.isDirectory()) {
                            tempProjectsFolder = driveAndFolder;
                            var innerContents = ugui.helpers.readAFolder(tempProjectsFolder);
                            //make sure there is at least one project folder in the projects folder
                            for (var k = 0; k < innerContents.length; k++) {
                                if (innerContents.length > 0 && innerContents[k].isFolder) {
                                    projectsFolder = tempProjectsFolder;
                                    scout.ftux.projectsFolder = projectsFolder;
                                    return;
                                }
                            }
                        }
                    }
                    catch (err) {
                        continue;
                    }
                }
            }
        }

        scout.ftux.projectsFolder = projectsFolder;
    }

    /**
     * Look in the projects/GitHub folder. Create checkboxes for each project folder.
     *
     * @param  {string} path Location of project folders
     */
    function autoGrabProjects (path) {
        $("#ftux .panel-body").empty();
        var projectsFolder = path || scout.ftux.projectsFolder;

        var projects = "";
        if (projectsFolder) {
            projects = ugui.helpers.readAFolder(projectsFolder);
        }
        if (!projectsFolder || projects.length < 1) {
            $("#ftux .panel-body").html(scout.localize('NO_PROJECTS_FOUND', true));
            return;
        }
        for (var i = 0; i < projects.length; i++) {
            if (projects[i].isFolder) {
                var name = projects[i].name;
                var item =
                  '<label class="col-xs-6">' +
                    '<input type="checkbox" value="' + projectsFolder + '/' + name + '" checked="checked"> ' +
                    name +
                  '</label>';
                $("#ftux .panel-body").append(item);
            }
        }
    }

    /**
     * The folder location in the footer of the Import Projects panel
     * @param  {string} path The Projects Folder path
     */
    function updatePanelContent (path) {
        var folder = "";
        if (scout.ftux.projectsFolder) {
            if (process.platform == "win32") {
                folder = path || scout.ftux.projectsFolder.split('/').join('\\');
            } else {
                folder = path || scout.ftux.projectsFolder;
            }
            $("#ftuxProjectsFolder").text(folder);
        }
    }

    function ftuxEvents () {
        $("#ftux .panel-body label").click(function () {
            ftuxUnlock();
        });
        $("#ftuxSelectAll").click(function () {
            var inputs = $("#ftux .panel-body input");
            for (var i = 0; i < inputs.length; i++) {
                $(inputs[i]).prop('checked', true);
            }
            ftuxUnlock();
        });
        $("#ftuxDeselectAll").click(function () {
            var inputs = $("#ftux .panel-body input");
            for (var i = 0; i < inputs.length; i++) {
                $(inputs[i]).prop('checked', false);
            }
            ftuxUnlock();
        });
        $("#ftuxStartImport").click(function (evt) {
            if ($("#ftuxStartImport").hasClass('gray')) {
                evt.preventDefault();
                return;
            }

            $("#addProjectBrowse").attr("nwworkingdir", $("#ftuxProjectsFolder").text());

            //Prevent importing projects multiple times from double-clicks
            $("#ftuxStartImport").addClass('gray');

            var inputs = $("#ftux .panel-body input:checked");
            for (var i = 0; i < inputs.length; i++) {
                var path = $(inputs[i]).val();
                //The index + 1 means it will never pass in a 0, and thus not be seen as falsey
                scout.helpers.autoGenerateProject(path, i + 1);
            }

            scout.helpers.saveSettings;
            unloadFTUX();
        });
        $("#ftuxPickFolder").unbind("click");
        $("#ftuxPickFolder").click(function (evt) {
            evt.preventDefault();
            $("#ftuxProjectBrowse").click();
            ftuxUnlock();
        });
        $("#ftuxProjectBrowse").change(function () {
            var path = $("#ftuxProjectBrowse").val();
            autoGrabProjects(path);
            updatePanelContent(path);
            ftuxUnlock();
            $("#ftux .panel-body label").click(function () {
                ftuxUnlock();
            });
        });
    }

    function ftuxUnlock () {
        var inputs = $("#ftux .panel-body input");
        var checked = $("#ftux .panel-body input:checked");

        if (inputs.length < 1 || checked.length < 1) {
            $("#ftuxStartImport").prop('disable', true).addClass('gray');
        } else {
            $("#ftuxStartImport").prop('disable', false).removeClass('gray');
        }
    }

    //The main FTUX function
    function ftux () {
        if (scout.projects.length < 1) {
            loadFTUX();
            autoGuessProjectsFolder();
            autoGrabProjects();
            updatePanelContent();
            ftuxEvents();
            ftuxUnlock();
        } else {
            unloadFTUX();
        }
    }

    //run once
    ftux();
    scout.helpers.ftux = ftux;

})();
