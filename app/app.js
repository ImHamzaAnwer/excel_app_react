var header = ["Book", "Author","Published","Years","Sales"];

var data = [
 ["Jason Bourne", "J. R. R. Tolkien", "English", "1954", "150 million"],
 ["The Accountant", "Antoine de Saint-Exupéry","French", "1943", "140 million"],
 ["Harry Potter", "J. K. Rowling", "English", "1997", "107 million"],
 ["Mission Impossible", "Agatha Christie", "English", "1939", "100 million"]
];

var table = React.createClass({
    _log: [],

    _logSetState: function(newState){
        if(this.log.length == 0){
            this._log.push(JSON.parse(JSON.stringify(this.state)));
        }
        this._log.push(JSON.parse(JSON.stringify(newState)));
        this.setState(newState);
    },

    componentDidMount:function(){
        document.onkeydown = function(e){
            if(e.altKey && e.shiftKey && e.which === 82){
                this._replay();
            }
        }.bind(this);
    },

    _replay: function(){
        if(this.log.length === 0){
            console.warn('No state to replay');
            return;
        }
        var idx = -1;
        var interval = setInterval(function(){
            idx++;
            if(idx === this._log.length -1){
                clearInterval(interval);
            }
            this.setState(this._log[idx]);
        }.bind(this),1000);
    },

    getInitialState: function(){
        return {
            data: this.props.initialData,
            sortBy: null,
            descending: false,
            edit: null
        };
    },

    _sort:function(e){
        var column = e.target.cellIndex;
        var data = this.state.data.slice();
        var descending = this.state.sortBy === column && !this.state.descending;

        data.sort(function(a,b){
            return descending ? (a[column] < b[column] ) : (a[column] > b[column] ) 
        });

        this.setState({
            data: data,
            sortBy: column,
            descending: descending
        });
    },

    _editCell: function(e){
        this.setState({
            edit:{
                row: parseInt(e.target.dataset.row,10),
                cell: e.target.cellIndex
            }
        });
    },

    _save: function(e){
        e.preventDefault();
        var input = e.target.firstChild;
        var data = this.state.data.slice();
        data[this.state.edit.row][this.state.edit.cell] = input.value;
        
        this.setState({
            edit: null,
            data: data
        });
    },
    
    _renderTable: function(){
        var self = this ;
        return(
            React.DOM.table(null,
                React.DOM.thead({onClick: this._sort},
                    React.DOM.tr(null,
                        this.props.header.map(function(title, idx){
                            if(this.state.sortBy === idx){
                                title += this.state.descending ? '\u2191' : '\u2193'
                            }
                            return React.DOM.th({key: idx}, title)
                        },this) // map function
                    )
                ),
                React.DOM.tbody({onDoubleClick : self._editCell},
                    this._renderSearch(),
                    self.state.data.map(function(row, rowidx){
                        return(
                            React.DOM.tr({key: rowidx},
                                row.map(function(cell,idx){
                                    var content = cell;
                                   
                                    var edit = self.state.edit;
                                    if(edit && edit.row === rowidx && edit.cell === idx ){
                                        var content = React.DOM.form({onSubmit: self._save},
                                            React.DOM.input({
                                                type: 'text',
                                                defaultValue: content
                                            })
                                        );
                                    } //if statment closed

                                    return React.DOM.td(
                                        {key: idx, 'data-row': rowidx},
                                         content
                                         );
                                }) //map function for table cellss (td)
                            )
                        );
                    })// map functions for table rows (tr)
                )
            )
        ); //returning table
    },
    
    _renderToolbar: function(){
        return React.DOM.div({className: 'toolbar'},
            React.DOM.button({onClick: this._toggleSearch}, 'Search'),
                React.DOM.a(
                    {onClick: this._download.bind(this, 'json'),href: 'data.json'},
                    'Export JSON'
                    ),
                    React.DOM.a({onClick: this._download.bind(this, 'csv'), href: 'data.csv'},
                    'Export CSV'
                    )
            );
        },

    _renderSearch: function(){
        if(!this.state.search){
            return  null;
        }

        return (
            React.DOM.tr({onChange: this._search},
                this.props.header.map(function(_ignore, idx){
                    return React.DOM.td({key: idx},
                        React.DOM.input({
                            type: 'text',
                            'data-idx': idx,
                        })
                    )
                })
            )
        );
    },

    _toggleSearch: function(){
        if(this.state.search){
            this.setState({
                data: this._preSearchData,
                search: false
            });
            this._preSearchData = null;
        } else {
            this._preSearchData = this.state.data;
            this.setState({
                search: true
            });
        }
    },

    _search: function(e){
        var needle = e.target.value.toLowerCase();
        if(!needle){
            this.setState({
                data: this._preSearchData
            });
            return;
        }

        var idx = e.target.dataset.idx;
        var searchdata = this._preSearchData.filter(function(row){
            return row[idx].toString().toLowerCase().indexOf(needle) > -1;
        });
        this.setState({ data: searchdata });
    },

    _download: function(format, ev){
        var contents = format === 'json' ? 
        JSON.stringify(this.state.data) : 
        this.state.data.reduce(function(result, row){
            return result
            + row.reduce(function(rowresult, cell, idx){
                return rowresult
                + ' "" '
                + cell.replace(/"/g, ' "" ' ) 
                + ' "" '
                + (idx < row.length -1 ? ',' : '') 
            }, '')
            + "\n";
        }, '');
    
        var URL = window.URL || window.webkitURL;
        var blob = new Blob( [contents], {type: 'text/' + format} );
        ev.target.href = URL.createObjectURL(blob);
        ev.target.download = 'data.' + format;
},

    render: function(){
        return(
            React.DOM.div(null,
                this._renderToolbar(),
                this._renderTable()
            )
        );
    }


});



ReactDOM.render(
    React.createElement(table, {
        header: header, 
        initialData: data
    }),
    document.getElementById('app')
);