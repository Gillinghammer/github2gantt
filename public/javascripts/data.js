function determineStatus(data) {
  let status = 'ok';
  let daysLeft = moment().diff(data.due_on, 'days');
  if (daysLeft >= 0) {
    status = 'overdue';
  } else if (daysLeft < 0 && daysLeft > -14) {
    status = 'warn';
  }
  return status;
}

function buildTasks(data) {
  let tasks = [];
  for (let i = 0; i < data.length; i++) {
    let status = determineStatus(data[i]);
    let progress =
      100 *
      (data[i].closed_issues / (data[i].closed_issues + data[i].open_issues));
    tasks.push({
      id: data[i].id.toString(),
      name: data[i].title,
      url: data[i].html_url,
      description: data[i].description,
      start: moment(data[i].start_on).format('YYYY-MM-D'),
      end: moment(data[i].due_on).format('YYYY-MM-D'),
      status: status,
      open_issues: data[i].open_issues,
      closed_issues: data[i].closed_issues,
      progress: progress || 0,
      dependencies: '',
    });
  }
  return tasks;
}

function updateStatus(task) {
  console.log('updating task status', task);
  if (task.status == 'overdue') {
    $(`[data-id=${task.id}]`).addClass('overdue');
    $(`[data-id=${task.id}]`).removeClass('warn');
  }
  if (task.status == 'warn') {
    $(`[data-id=${task.id}]`).addClass('warn');
    $(`[data-id=${task.id}]`).removeClass('overdue');
  }
  if (task.status == 'ok') {
    $(`[data-id=${task.id}]`).removeClass('overdue');
    $(`[data-id=${task.id}]`).removeClass('warn');
  }
}

// on page load fetch milestone data
$.get('/milestones', function (data) {
  let tasks = buildTasks(data);
  let viewMode = 'Month';
  loadSvg(tasks);
  updateViewMode(viewMode);
  window.updateStatus = updateStatus;
  window.determineStatus = determineStatus;
});

$('#refresh').on('click', function () {
  $.post('/refresh', function (data) {
    loadSvg(buildTasks(data));
    alert('Milestone issues updated.');
  });
});

$('#reset').on('click', function () {
  if (
    window.confirm(
      'This will reset all of the milestone dates, are you sure you want to continue?'
    )
  ) {
    $.post('/reset-my-project', function (data) {
      alert('Milestones reset');
      loadSvg(buildTasks(data));
    });
  }
});

$('button.mode-selector').on('click', function (event) {
  let selectedMode = event.target.innerText;
  updateViewMode(selectedMode);
});

function updateViewMode(mode) {
  window.gantt.change_view_mode(mode); // Quarter Day, Half Day, Day, Week, Month
}

function loadSvg(tasks) {
  window.gantt = new Gantt('#gantt', tasks, {
    header_height: 50,
    column_width: 30,
    step: 15,
    view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
    bar_height: 20,
    bar_corner_radius: 5,
    arrow_curve: 5,
    padding: 18,
    view_mode: 'Month',
    date_format: 'YYYY-MM-DD',
    custom_popup_html: function (task) {
      // the task object will contain the updated
      // dates and progress value
      const end_date = moment(task._end).format('MMM D');
      return `
        <div class="ui card">
            <div class="content">
                <a href="${task.url} target="_blank"><div class="header"><i class="linkify icon"></i>${task.name}</div></a>
            </div>
            <div class="content">
                <h4 class="ui sub header">Description</h4>
                <div class="summary">
                    ${task.description}
                </div>
                <div class="ui small feed">
                <div class="event">
                    <div class="content">
                        <div class="summary">
                            Target completion: ${end_date}
                        </div>
                    </div>
                </div>
                <div class="event">
                    <div class="content">
                        <div class="summary">
                            Open issues: ${task.open_issues}
                            Closed issues: ${task.closed_issues}
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </div>
      `;
    },
    on_click: function (task) {
      console.log(task);
    },
    on_date_change: function (task, start, end) {
      $('#saving').addClass('active');
      let startDate = moment(start).format('YYYY-MM-DD');
      let endDate = moment(end).format('YYYY-MM-DD');
      let milestoneId = task.id;
      console.log({ milestoneId, start, startDate, end, endDate });
      $.post('/update/' + milestoneId, { startDate, endDate });
      let updatedStatus = window.determineStatus({ due_on: endDate });
      task.status = updatedStatus;
      window.updateStatus(task);
      setTimeout(function () {
        $('#saving').removeClass('active');
      }, 500);
    },
    on_progress_change: function (task, progress) {
      console.log(task, progress);
    },
    on_view_change: function (mode) {
      let buttons = $('button.ui.button.mode-selector');
      for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].innerText == mode) {
          $(buttons[i]).removeClass('basic');
        } else {
          $(buttons[i]).addClass('basic');
        }
      }
    },
  });
  for (var i = 0; i <= tasks.length; i++) {
    updateStatus(tasks[i]);
  }
}
