/*
    Adapted from Artist Explorer's dndTree.js
*/
$(document).ready(function() {
    'use strict';

    // Misc. variables
    var i = 0;
    var duration = 750;
    var root;
    var rightPaneWidth = 300;

    var exploredArtistIds = [];
    var lastClickedArtist = root;

    // avoid clippath issue by assigning each image its own clippath
    var clipPathId = 0;

    // size of the diagram
    var viewerWidth = $(window).width() - rightPaneWidth;
    var viewerHeight = $(window).height();

    var lastExpandedNode;

    var tree = d3.layout.tree()
        .size([viewerHeight, viewerWidth]);

    var diagonal = d3.svg.diagonal()
        .projection(function(d) {
            return [d.y, d.x];
        });

    // Define the zoom function for the zoomable tree
    function zoom() {
        svgGroup.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
    }

    // define the zoomListener which calls the zoom function on the 'zoom' event constrained within the scaleExtents
    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on('zoom', zoom);

    // define the baseSvg, attaching a class for styling and the zoomListener
    var baseSvg = d3.select('#tree-view').append('svg')
        .attr('width', viewerWidth)
        .attr('height', viewerHeight)
        .attr('class', 'overlay')
        .call(zoomListener);

    function updateWindow() {
        viewerWidth = $(window).width() - rightPaneWidth;
        viewerHeight = $(window).height();
        baseSvg.attr('width', viewerWidth).attr('height', viewerHeight);
        if(lastExpandedNode) {
            centerNode(lastExpandedNode);
        }
    }

    // Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.
    function centerNode(source) {
        lastExpandedNode = source;
        var scale = zoomListener.scale();
        var x = -source.y0;
        var y = -source.x0;
        x = x * scale + viewerWidth / 4;
        y = y * scale + viewerHeight / 2;
        d3.select('#tree-view g').transition()
            .duration(duration)
            .attr('transform', 'translate(' + x + ',' + y + ')scale(' + scale + ')');
        zoomListener.scale(scale);
        zoomListener.translate([x, y]);
    }

    function addChild(node, artist) {
        if(!node.children) {
            node.children = [];
        }
        node.children.push(
            {
                artist: artist,
                children: null,
                queried: false
            }
        );
        exploredArtistIds.push(artist.id);
        update(node);
        centerNode(node);
    }

    function initWith(artist) {
        exploredArtistIds.push(artist.id);
        return {
            artist : artist,
            children: null,
            queried: false
        }
    };

    function initWithData(from, to) {
        if(from.artist) {
            to.artist = from.artist;
            exploredArtistIds.push(to.artist.id);
        }
        if(from.children) {
            to.children = [];
            from.children.forEach(function(child) {
                var obj = {};
                initWithData(child, obj);
                to.children.push(obj);
            })
        }
    }

    function removeExpandedId(d) {
        if(d.children) {
            d.children.forEach(function(node) {
                removeExpandedId(node);
            });
        }
        var indexToRem = exploredArtistIds.indexOf(d.artist.id);
        exploredArtistIds.splice(indexToRem, 1);
    }

    function removeChildrenFromExplored(d) {
        d.children.forEach(function(node) {
            removeExpandedId(node);
        });
    }

    // Toggle children function
    function toggleChildren(d) {
        if(d.children) {
            removeChildrenFromExplored(d);
            d.children = null;
            d.queried = false;
            update(d);
            centerNode(d);
        } else {
            if(!d.queried) {
                d.queried = true;
                AT.getSimilarArtistsForNode(d, exploredArtistIds);
            }
        }
        return d;
    }

    function click(d) {
        d = toggleChildren(d);
        if(lastClickedArtist !== d) {
            lastClickedArtist = d;
            AT.getTopTracksForArtist(d.artist);
        }
    }

    function update(source) {
        var levelWidth = [1];
        var childCount = function(level, n) {
            if(n.children && n.children.length > 0) {
                if(levelWidth.length <= level + 1) levelWidth.push(0);

                levelWidth[level + 1] += n.children.length;
                n.children.forEach(function(d) {
                    childCount(level + 1, d);
                });
            }
        };

        childCount(0, root);
        var newHeight = d3.max(levelWidth) * 100;
        tree = tree.size([newHeight, viewerWidth]);

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse();
        var links = tree.links(nodes);

        // Set widths between levels
        nodes.forEach(function(d) {
             d.y = (d.depth * 220);
        });

        // Update the nodes…
        var node = svgGroup.selectAll('g.node')
            .data(nodes, function(d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr('transform', function(d) {
                return 'translate(' + source.y0 + ',' + source.x0 + ')';
            })
            .on('click', click);

        nodeEnter.append('circle')
            .attr('r', 32)
            .style('fill', function(d) {
                return d.children ? 'black' : '#fff';
            });

        clipPathId++;

        nodeEnter.append('clipPath')
            .attr('id', 'clipCircle' + clipPathId)
                .append('circle')
                .attr('r', 32);

        nodeEnter.append('image')
            .attr('xlink:href', function(d) {
                return AT.getImage(d.artist.images);
            })
            .attr('x', '-32px')
            .attr('y', '-32px')
            .attr('clip-path', 'url(#clipCircle' + clipPathId + ')')
            .attr('width',
              function(d) {
                  var image = d.artist.images[d.artist.images.length-2];
                  if(!image) {
                    return 64;
                  }
                  if(image.width > image.height) {
                      return 64 * (image.width / image.height)
                  } else {
                      return 64;
                  }
              })
            .attr('height',
              function(d) {
                  var image = d.artist.images[d.artist.images.length-2];
                  if(!image) {
                    return 64;
                  }
                  if(image.height > image.width) {
                      return 64 * (image.height/image.width)
                  } else {
                      return 64;
                  }
              })

        nodeEnter.append('text')
            .attr('x', function(d) {
                return 40;
            })
            .attr('dy', '.35em')
            .attr('class', 'nodeText')
            .attr('text-anchor', function(d) {
                return 'start';
            })
            .text(function(d) {
                return d.artist.name;
            })
            .style('fill-opacity', 0);

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr('transform', function(d) {
                return 'translate(' + d.y + ',' + d.x + ')';
            });

        // Fade the text in
        nodeUpdate.select('text')
            .style('fill-opacity', 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr('transform', function(d) {
                return 'translate(' + source.y + ',' + source.x + ')';
            })
            .remove();

        nodeExit.select('circle')
            .attr('r', 0);

        nodeExit.select('text')
            .style('fill-opacity', 0);

        // Update the links…
        var link = svgGroup.selectAll('path.link')
            .data(links, function(d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert('path', 'g')
            .attr('class', 'link')
            .attr('d', function(d) {
                var o = {
                    x: source.x0,
                    y: source.y0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr('d', diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr('d', function(d) {
                var o = {
                    x: source.x,
                    y: source.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    var svgGroup = baseSvg.append('g');

    function copyTree(from, to) {
        if(from.artist) {
            to.artist = from.artist;
        }
        if(!from.children) {
            return;
        }
        to.children = [];
        from.children.forEach(function(node) {
            var child = {};
            copyTree(node, child);
            to.children.push(child);
        })
    }

    function serializeTree() {
        var obj = {};
        copyTree(root, obj);
        return obj;
    }

    window.d3Tree = {
        setRoot: function(artist) {
            exploredArtistIds = [];
            root = initWith(artist);
            root.x0 = viewerHeight / 2;
            root.y0 = 0;
            update(root);
            centerNode(root);
            click(root);
        },

        setRootData: function(rootData) {
            exploredArtistIds = [];
            root = {};
            initWithData(rootData, root);
            root.x0 = viewerHeight / 2;
            root.y0 = 0;
            lastClickedArtist = root;
            update(root);
            centerNode(root);
        },

        getRoot: function() {
            return serializeTree();
        },

        resizeOverlay: function() {
            updateWindow();
        },

        _addChild: function(node, artist) {
            addChild(node, artist);
        }
    };
});

