/* Copyright 2012-2018 Ministerie van Sociale Zaken en Werkgelegenheid
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';

class Caret extends React.Component {
    render() {
        if (!this.props.show) {
            return null;
        }
        var caret = <span className="caret"></span>;
        if (this.props.table_sort_ascending) {
            caret = <span className="dropup">{caret}</span>;
        }
        return caret;
    }
}

class BootstrapTableHeader extends React.Component {
    buildReportHeaders(headers) {
        return [<th key={0} />, 
                <th id={headers[1][0]} key={1} width="90px" onClick={this.props.onSort} style={{cursor: "pointer"}}>
                    {headers[1][1]}<Caret show={headers[1][0] === this.props.table_sort_column_name}
                            table_sort_ascending={this.props.table_sort_ascending}/>
                </th>
            ].concat(
                headers.slice(2).map(
                    (header, index) =>
                        <th id={header[0]} key={index+2} onClick={this.props.onSort} style={{cursor: "pointer"}}>
                            {header[1]}<Caret show={header[0] === this.props.table_sort_column_name}
                                            table_sort_ascending={this.props.table_sort_ascending}/>
                        </th>
            ));
    }

    render() {
        return (
            <thead>
                <tr>
                    {this.buildReportHeaders(this.props.headers)}
                </tr>
            </thead>
        );
    }
}

class BootstrapTableBody extends React.Component {

    buildTdCells(children) {
        var rows = [];
        children.forEach(function(row) {
            rows.push(row['cells'].map((cell, index) => 
                cell.hasOwnProperty('__html') ?
                    <td className="report_cell" key={index} dangerouslySetInnerHTML={cell}></td> : 
                    <td className="report_cell" key={index}>{cell}</td>
            ));
        });
        return rows;
    }

    buildRowsOfReport(rows) {
       return rows.map((row, index) => 
            {
                var hasExtraInfo =  (this.props.children[index]['extra_info'] 
                                        && !(Object.keys(this.props.children[index]['extra_info']).length === 0))
                var hasDetailPane = hasExtraInfo;
                var chdId = this.props.children[index]['id'];

                var toggleButton = hasDetailPane ?
                    <DetailToggleButton key={chdId} data_target={'#' + chdId + '_details'} /> :
                    <button type="button" key={chdId} className="btn glyphicon glyphicon-chevron-right disabled" />
                
                var ret = [
                    <tr key={chdId} className={this.props.children[index]['className']}>
                        <td>{toggleButton}</td>
                        {row}
                    </tr>]

                if (hasDetailPane) {
                    ret.push(<DetailPane key={chdId + 'p'} has_extra_info={hasExtraInfo} metric_detail={this.props.children[index]} />);
                }
                return ret;
            });
    }

    render() {
        var rows = this.buildTdCells(this.props.children);
        return (
            <tbody>
                {this.buildRowsOfReport(rows)}
            </tbody>
        )
    }
}

class DetailPane extends React.Component {
    renderExtraInfoPanel(extra_info) {
        return this.props.has_extra_info ? <TablePanel extra_info={extra_info}/> : '';
    }
    render() {
        var cls = this.props.metric_detail['className'];
        return (
            <tr id={this.props.metric_detail['id'] + '_details'} className={cls + " collapse"}>
                <td className="detail_pane" colSpan="6">
                    {this.renderExtraInfoPanel(this.props.metric_detail['extra_info'])}
                </td>
            </tr>
        );
    }
}

class TablePanel extends React.Component {
    renderHeader(headers) {
        return (
            <thead>
                <tr>
                    {Object.values(headers).map((col, index) => {
                        return col[0] !== '_' ? <th key={index}>{col}</th> : null
                    })}
                </tr>
            </thead>)
    }

    formatCell(cell_content) {
        if (cell_content && cell_content.hasOwnProperty('href')) {
            return <a href={cell_content.href}>{cell_content.text || cell_content.href}</a>
        }
        return cell_content;      
    }

    getFormatColumns(headers) {
        var format_columns = [];

        for (var k in headers)
        {
            if(headers[k][0] === '_')
            {
            	format_columns.push(k);
            }
        }
        return format_columns;
    }

    applyClassNames(row, format_columns, headers) {
        var classNames = [];

        for(var h in format_columns)
        {
            if (row[format_columns[h]] === true || row[format_columns[h]] === "true") {
                classNames.push(headers[format_columns[h]].substr(1));
            }
        }
        return classNames;
    }

    renderTableBody(extra_info) {
        const columns = Object.keys(extra_info.headers);
        var rows;
        var format_columns = this.getFormatColumns(extra_info.headers);

        if(extra_info && extra_info.data) {
            rows = extra_info.data.map((row, index) => {

                var classNames = this.applyClassNames(row, format_columns, extra_info.headers);
                var clsName = 'detail-row-default';
                if (classNames.length > 0) {
                    clsName = classNames.join(' '); 
                }

                return (
                <tr key={index} className={clsName}>
                    {columns.map((col) => {
                        return extra_info.headers[col][0] !== '_' ? <td key={col + "_" + index}>{this.formatCell(row[col])}</td> : null
                    })}
                </tr>
                );
            })
        }
        return (            
            <tbody>
                {rows}
            </tbody>
        );
    }

    render() {
        return (
            <div className="panel panel-default">
                <h4 className="panel-heading">{this.props.extra_info["title"]}</h4>
                <div className="panel-body">
                    <table className="table-striped">
                        {this.renderHeader(this.props.extra_info["headers"])}
                        {this.renderTableBody(this.props.extra_info)}
                    </table>
                </div>
            </div>
        );
    }
}

class DetailToggleButton extends React.Component {
    state = {
        isExpanded: false
    }
    
    handleClick = () => this.setState({ isExpanded: !this.state.isExpanded});
    
    render() {
        return (
            <button type="button" 
                className={"btn glyphicon can_expand" + 
                        (this.state.isExpanded ? " glyphicon-chevron-down" : " glyphicon-chevron-right")}

                onClick={this.handleClick} 
                data-toggle="collapse" 
                data-target={this.props.data_target}>
            </button>
        );
    }
}

class BootstrapTable extends React.Component {
    render() {
        return (
            <table className={"table" + (this.props.className ? " " + this.props.className : "")}>
                <BootstrapTableHeader {...this.props} />
                <BootstrapTableBody>
                    {this.props.children}
                </BootstrapTableBody>
            </table>
        );
    }
}

export {BootstrapTable};
