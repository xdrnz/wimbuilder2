function build_page_init() {
    $('#build_stdout').empty();
    if (selected_project != null) {
        var msg = 'Do you want to build the [' + selected_project + '] project?';
        var opts = patches_opt_stringify();
        msg += '<br/><br/>' + opts;
        $('#build_stdout').append(msg);
    } else {
        $('#build_stdout').append('No project to build.');
    }

    $("input[name='wb_x_drive'][type='radio'][value='" + $wb_x_drv + "']").prop("checked", true);
}

$("input[name='wb_x_drive'][type='radio']").click(function() {
    $wb_x_drv = $(this).val();
});

function x_drive_exists() {
    //var env = wsh.Environment("PROCESS");
    //var sys_drive = env('HOMEDRIVE');
    if (fso.DriveExists($wb_x_drv)) {
        return 1;
    }
    return 0;
}

function structure_env(mode) {
    var env = wsh.Environment("PROCESS");
    env('WB_STRAIGHT_MODE') = $wb_straight_mode;

    env('WB_WORKSPACE') = $wb_workspace;

    env('WB_SRC_FOLDER') = $wb_src_folder;
    env('WB_SRC') = $wb_src;
    env('WB_BASE') = $wb_base;
    env('WB_SRC_INDEX') = $wb_src_index;
    env('WB_BASE_INDEX') = $wb_base_index;


    env('WB_PROJECT') = selected_project;
    env('WB_SKIP_UFR') = $wb_skip_ufr;
    env('WB_SKIP_URR') = $wb_skip_urr;
    env('WB_X_DRIVE') = $wb_x_drv;
    env('X') = $wb_x_drv;
    env('_WB_EXEC_MODE') = mode;

    //env('WB_OPT_SHELL') = $WB_OPT['shell'];
}

function _cleanup() {
    $('#build_stdout').empty();
    structure_env(1);
    var oExec = wsh.exec('bin\\_cleanup.bat');
    var stdout = null;
    var b = null;
    window.setTimeout(function(){wsh.AppActivate('Wim Builder');}, 500);
    update_output(oExec);
}

function x_drive_confirm() {
    var rt_env = this;
    $("#x-drive-confirm").dialog({
      resizable: false,
      height: "auto",
      width: "auto",
      modal: true,
      buttons: [{
          text: i18n_t('Continue'),
          click: function() {
          $(this).dialog("close");
          if (rt_env.build_action == 'cleanup') {
              cleanup(1);
          } else if (rt_env.build_action == 'run_build') {
              run_build(1);
          } else if (rt_env.build_action == 'exec_build') {
              exec_build(1);
          }
        }},
        { text: i18n_t('Cancel'),
          click: function() {
          $(this).dialog("close");
        }
      }]
    });
}

function cleanup(no_confirm) {
    if (selected_project == null) {
        alert('Please select a project for building.');
        return;
    }

    if (x_drive_exists() == 1) {
        if (!no_confirm) {
            this.build_action = 'cleanup';
            x_drive_confirm();
            return;
        }
    }

    window.setTimeout(function(){_cleanup();}, 100);
}

//WshHide 0;WshNormalFocus 1;WshMinimizedNoFocus 6
function run_build(no_confirm) {
    if (selected_project == null) {
        alert('Please select a project for building.');
        return;
    }

    if (x_drive_exists() == 1) {
        if (!no_confirm) {
            this.build_action = 'run_build';
            x_drive_confirm();
            return;
        }
    }

    $('#build_stdout').empty();
    structure_env(0);
    dump_patches_selected();
    dump_patches_opt();
    wsh.run('cmd /k \"' + $wb_root + '\\bin\\_process.bat\"', 1, true);
}

function exec_build(no_confirm) {
    if (selected_project == null) {
        alert('Please select a project for building.');
        return;
    }

    if (x_drive_exists() == 1) {
        if (!no_confirm) {
            this.build_action = 'exec_build';
            x_drive_confirm();
            return;
        }
    }

    $('#build_stdout').empty();
    structure_env(1);
    dump_patches_selected();
    dump_patches_opt();
    var oExec = wsh.exec($wb_root + '\\bin\\_process.bat');
    var stdout = null;
    var b = null;
    window.setTimeout(function(){wsh.AppActivate('Wim Builder');}, 500);
    update_output(oExec);
}

function make_iso() {
    if (selected_project == null) {
        alert('Please select a project for building.');
        return;
    }
    $('#build_stdout').empty();
    structure_env(0);
    wsh.run('cmd /c \"' + $wb_root + '\\bin\\_MakeBootISO.bat\"', 1, true);
}

function sleep(n) {
    var start = new Date().getTime();
    while (true) if (new Date().getTime() - start > n) break;
}

function update_output(oExec) {
    stdout = oExec.StdOut.ReadLine();
    if (stdout.length > 0) {
        $('#build_stdout').append(stdout + '<br/>');
    }
    if (!oExec.StdOut.AtEndOfStream) {
        stdout = oExec.StdOut.ReadLine();
        if (stdout.length > 0) {
            $('#build_stdout').append(stdout + '<br/>');
        }
    }
    if (oExec.status != 0) {
        if (!oExec.StdOut.AtEndOfStream) {
            stdout = oExec.StdOut.ReadAll();
            if (stdout.length > 0) {
                $('#build_stdout').append(stdout + '<br/>');
            }
        }
        return;
    }
    window.setTimeout(function(){update_output(oExec);}, 100);
}

