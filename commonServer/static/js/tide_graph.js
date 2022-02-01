var addTideGraph = function(tide_data, container)
{
    stationId = tide_data.station_id;

    var entries = [];
    var now = Date.now();
    var entryDate;
    var currentHeight;
    tide_data.tide_entries.forEach( function(entry, index) {
        entryDate = new Date(entry.time);
        entries.push({"x": entryDate, "y": parseFloat(entry.height_ft)})
        if (! currentHeight && entryDate.getTime() > now && entries.length > 1)
        {
            currentHeight = getCurrentTideHeight(entries[entries.length-2], entries[entries.length-1])
        }
    });

//    console.log(JSON.stringify(entries));
//    console.log("CurrentHeight: "+currentHeight);

    tideDiv = $("<div style='display: block; padding-bottom: 20px;'></div>")
    tideDiv.append('<div>'+tide_data.location+(currentHeight ? ' ('+currentHeight+' ft)' : '')+'</div>');
    tideDiv.append("<div style='max-width: 1200px'><canvas id='tides"+stationId+"' ></canvas></div>");
    container.append(tideDiv);
    ctx = $("#tides"+stationId);

    var tideChart = new Chart(ctx, {
        type: "line",
        data: {
            datasets: [{
                label: "height (ft)",
                data: entries,
                borderWidth: 1,
                borderColor: 'rgba(10,90,255,.5)',
                backgroundColor: 'rgba(10,90,255,.1)'
            }],
        },
        options: {
            legend: {
                show: false
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        displayFormats: {
                            'hour': 'D MMM HH:00'
                        },
                        stepSize: 6
                    },
                    ticks: {
                        callback: function (value, index, values) {
                            dateToShow = new Date(values[index].value);
                            if (index === 0 || dateToShow.getHours() < 6)
                            {
                               return moment(dateToShow).format('D MMM Y HH:mm')
                            }
                            else
                            {
                                return moment(dateToShow).format('HH:mm')
                            }
                        },
                    }
                }]
            },
            annotation: {
                drawTime: 'afterDatasetsDraw',
                annotations: [{
                    id: "nowLine",
                    type: "line",
                    mode: "vertical",
                    scaleID: "x-axis-0",
                    position: "top",
                    borderWidth: 1,
                    borderColor: "rgba(6,51,143,0.5)",
                    value: moment().toDate(),
                    label: {
                        content: "now",
                        enabled: "True",
                        position: "top",
                        backgroundColor: "rgba(0,0,0,0)",
                        fontColor: 'black',
                        fontStyle: "oblique"
                    }
                }]
            }
        }
    });
};

var loadTide = function(stationName, container, loading_icon, tides_endpoint) {
    request_data = {};
    request_data.location = {};
    request_data.location.name = stationName;

    var loadingDiv = $("<div id='loading"+stationName+"' class='loadingimage'><span class='loadingText'> Loading "+stationName+"</span> <img src='"+loading_icon+"'   height='50px'/></div>");
    tideChartsDiv.append(loadingDiv);

    $.ajax({
        method: "GET",
        url: tides_endpoint+"?location_name="+stationName,
        success: function (data) {
            console.log(data);
            if (data.success)
            {
                console.log("Trying to remove loading div "+loadingDiv);
                loadingDiv.remove();
                addTideGraph(data.tide_data, container);
            }
            else
            {
                loadingDiv.remove();
                showMessage("errorMessage", "Unable to tide data "+data.message);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log("Ajax call failed: " + textStatus + ": " + errorThrown);
            showMessage("errorMessage", "Unable to get tide data: "+textStatus + ": " + errorThrown);
        }
    });
}

var getCurrentTideHeight = function(previousTideEntry, nextTideEntry)
{
    var now = Date.now();
    var prevTime = previousTideEntry.x.getTime();
    var nextTime = nextTideEntry.x.getTime();
    var A = Math.PI* (((now - prevTime)/(nextTime - prevTime)) + 1)
    var h = previousTideEntry.y + (nextTideEntry.y - previousTideEntry.y) * ((Math.cos(A) + 1)/2)
    return h.toFixed(1);
}