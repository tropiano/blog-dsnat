//var data = [[5,3], [10,17], [15,4], [2,8]];
d3.csv("teamdata.csv", function(error, data){
   
    var margin = {top: 50, right: 50, bottom: 50, left: 50}
      , width = 600 - margin.left - margin.right
      , height = 600 - margin.top - margin.bottom;
    
    var x = d3.scale.linear()
              .domain([0, d3.max(data, function(d) { return +d["iii"]; })])
              .range([0, width ]);
    
    var y = d3.scale.linear()
    	      .domain([0, d3.max(data, function(d) { return +d["total"]; })])
    	      .range([height, 0 ]);
 
	
	
    var chart = d3.select('body')
	.append('svg:svg')
	.attr('width', width + margin.right + margin.left)
	.attr('height', height + margin.top + margin.bottom)
	.attr('class', 'chart')

    var main = chart.append('g')
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
	.attr('width', width)
	.attr('height', height)
	.attr('class', 'main')  
        
    // draw the x axis
    var xAxis = d3.svg.axis()
	.scale(x)
	.orient('bottom');

    main.append('g')
	.attr('transform', 'translate(0,' + height + ')')
	.attr('class', 'main axis date')
	.call(xAxis);

    // draw the y axis
    var yAxis = d3.svg.axis()
	.scale(y)
	.orient('left');

    main.append('g')
	.attr('transform', 'translate(0,0)')
	.attr('class', 'main axis date')
	.call(yAxis);

    var g = main.append("svg:g"); 
    
	// Define the div for the tooltip
	var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);
	
    g.selectAll("scatter-dots")
      .data(data)
      .enter().append("svg:circle")
          .attr("cx", function (d,i) { return x(+d["iii"]); } )
          .attr("cy", function (d) { return y(+d["total"]); } )
          .attr("r", 5)
		  .on("mouseover", function(d) {		
            div.transition()		
                .duration(200)		
                .style("opacity", .9);		
            div.html(d.region)	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px");	
            })					
        .on("mouseout", function(d) {		
            div.transition()		
                .duration(500)		
                .style("opacity", 0);});
})			