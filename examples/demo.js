var getDemoData = function(callback) {
    var req=new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState === 4) {
            if (req.status === 200) {
                var d = JSON.parse(req.responseText);
                return callback(null, d);
            } else {
                var e = new Error(req.status);
                return callback(e, null);
            }
        }
    }
    req.open("GET", "/demo", true);
    req.send();
}

var getVersionInfo = function(callback) {
    var req=new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState === 4) {
            if (req.status === 200) {
                var d = JSON.parse(req.responseText);
                return callback(null, d);
            } else {
                var e = new Error(req.status);
                return callback(e, null);
            }
        }
    }
    req.open("GET", "/version", true);
    req.send();
}

var createGraphProperties = function(name, graph) {
    if (typeof graph.inports === 'undefined') {
        return null;
    }

    var graphName = document.createElement('p');
    var portsInfo = document.createElement('ul');
    graphName.innerHTML = name;

    var inports = Object.keys(graph.inports);
    inports.forEach(function (name) {
        var port = inports[name];

        var portInfo = document.createElement('li');
        portInfo.className = 'line';

        var portName = document.createElement('label');
        portName.className = "portLabel";
        var portInput = document.createElement('input');
        portName.innerHTML = "<span>"+name+"</span>";
        portInput.name = name;
        portInput.className = "portInput";

        // TODO: show information about type,value ranges, default value, description etc
        portInfo.appendChild(portName);
        portName.appendChild(portInput);
        portsInfo.appendChild(portInfo);
    });

    return portsInfo;
}

var createGraphList = function(graphs, onClicked) {
    var list = document.createElement('ul');
    list.onclick = onClicked;

    Object.keys(graphs).forEach(function(name) {
        if (typeof graphs[name].inports !== 'undefined') {
            var e = document.createElement('li');
            e.className = "graphEntry";
            e.innerHTML = name;
            list.appendChild(e);
        }
    });
    return list;
}

var createLogEntry = function(url) {
    var img = document.createElement("img");
    img.className = "image";
    img.src = url;

    var req = document.createElement("p");
    req.innerHTML = "GET " + url.replace('&', '\n&')
    req.className = "request";

    var div = document.createElement("div");
    div.className = "logEntry";
    div.appendChild(req);
    div.appendChild(img);
    return div;
}

var createRequestUrl = function(graphname, parameters, apiKey, apiSecret) {
    var hasQuery = Object.keys(parameters).length > 0;
    var search = graphname + (hasQuery ? '?' : '');
    for (var key in parameters) {
        var value = encodeURIComponent(parameters[key]);
        search += key+'='+value+'&';
    }
    if (hasQuery) {
        search = search.substring(0, search.length-1); // strip trailing &
    }

    var url = '/graph/'+search;
    if (apiKey || apiSecret) {
        // FIXME: implement md5 hashing of search
        var base = search+apiSecret;
        var token = CryptoJS.MD5(base);
        url = '/graph/'+apiKey+'/'+token+'/'+search;
    }

    return url;
}

var getGraphProperties = function(container, name, graphdef) {
    var props = {};
    var inputs = container.getElementsByTagName('input');
    for (var i=0; i<inputs.length; i++) {
        var input = inputs[i];
        if (input.value !== '') {
            props[input.name] = input.value;
        }
    }
    return props;
}

var main = function() {

    var id = function(n) {
        return document.getElementById(n);
    }

    var addEntry = function(url) {
        var e = createLogEntry(url);
        id('historySection').insertBefore(e, id('historySection').firstChild);
    }

    var activeGraphName = null;
    var availableGraphs = null;

    var readApiInfo = function() {
        id("apiKey").value = localStorage["imgflo-server-api-key"] || "";
        id("apiSecret").value = localStorage["imgflo-server-api-secret"] || "";
    };
    readApiInfo();

    id('clearApiInfo').onclick = function () {
        localStorage["imgflo-server-api-key"] = "";
        localStorage["imgflo-server-api-secret"] = "";
        readApiInfo();
    };

    id('runButton').onclick = function () {
        var graph = activeGraphName;
        var props = getGraphProperties(id('graphProperties'), graph, availableGraphs[graph]);
        var apiKey = id("apiKey").value;
        var apiSecret = id("apiSecret").value;
        localStorage["imgflo-server-api-key"] = apiKey;
        localStorage["imgflo-server-api-secret"] = apiKey;
        var u = createRequestUrl(graph, props, apiKey, apiSecret);
        addEntry(u);
    };

    var setActiveGraph = function(name) {
        if (typeof availableGraphs[name] === 'undefined') {
            return false;
        }
        activeGraphName = name;
        var container = id('graphProperties');
        if (container.children.length) {
            container.removeChild(container.children[0]);
        }
        var e = createGraphProperties(name, availableGraphs[name]);
        container.appendChild(e);
        return true;
    }

    var onGraphClicked = function(event) {
        var name = event.target.innerText;
        console.log("onGraphClicked", name, event.target);
        setActiveGraph(name);
    }

    getDemoData(function(err, demo) {
        if (err) {
            throw err;
        }

        availableGraphs = demo.graphs;
        setActiveGraph(Object.keys(availableGraphs)[0]);

        var l = createGraphList(demo.graphs, onGraphClicked);
        id('graphList').appendChild(l);
        var images = [
            "demo/grid-toastybob.jpg"
        ];
        images.forEach(function(image) {
            addEntry(image);
        });
    });

    getVersionInfo(function(err, res) {
        var version = "Unknown";
        if (!err && res.server) {
            version = res.server.toString();
        }
        id('version').innerHTML = 'imgflo-server: ' + version;
    });

}
window.onload = main;
