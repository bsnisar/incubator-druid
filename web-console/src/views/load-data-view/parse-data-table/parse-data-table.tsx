/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import classNames from 'classnames';
import React from 'react';
import ReactTable from 'react-table';

import { TableCell } from '../../../components';
import { caseInsensitiveContains, filterMap, parseJson } from '../../../utils';
import { FlattenField } from '../../../utils/ingestion-spec';
import { HeaderAndRows, SampleEntry } from '../../../utils/sampler';

import './parse-data-table.scss';

export interface ParseDataTableProps extends React.Props<any> {
  sampleData: HeaderAndRows;
  columnFilter: string;
  canFlatten: boolean;
  flattenedColumnsOnly: boolean;
  flattenFields: FlattenField[];
  onFlattenFieldSelect: (field: FlattenField, index: number) => void;
}

export class ParseDataTable extends React.PureComponent<ParseDataTableProps> {
  render() {
    const {
      sampleData,
      columnFilter,
      canFlatten,
      flattenedColumnsOnly,
      flattenFields,
      onFlattenFieldSelect,
    } = this.props;

    return (
      <ReactTable
        className="parse-data-table -striped -highlight"
        data={sampleData.rows}
        columns={filterMap(sampleData.header, (columnName, i) => {
          if (!caseInsensitiveContains(columnName, columnFilter)) return null;
          const flattenFieldIndex = flattenFields.findIndex(f => f.name === columnName);
          if (flattenFieldIndex === -1 && flattenedColumnsOnly) return null;
          const flattenField = flattenFields[flattenFieldIndex];
          return {
            Header: (
              <div
                className={classNames({ clickable: flattenField })}
                onClick={() => {
                  if (!flattenField) return;
                  onFlattenFieldSelect(flattenField, flattenFieldIndex);
                }}
              >
                <div className="column-name">{columnName}</div>
                <div className="column-detail">
                  {flattenField ? `${flattenField.type}: ${flattenField.expr}` : ''}&nbsp;
                </div>
              </div>
            ),
            id: String(i),
            accessor: (row: SampleEntry) => (row.parsed ? row.parsed[columnName] : null),
            Cell: row => {
              if (row.original.unparseable) {
                return <TableCell unparseable />;
              }
              return <TableCell value={row.value} />;
            },
            headerClassName: classNames({
              flattened: flattenField,
            }),
          };
        })}
        SubComponent={rowInfo => {
          const { raw, error } = rowInfo.original;
          const parsedJson: any = parseJson(raw);

          if (!error && parsedJson && canFlatten) {
            return (
              <pre className="parse-detail">
                {'Original row: ' + JSON.stringify(parsedJson, null, 2)}
              </pre>
            );
          } else {
            return (
              <div className="parse-detail">
                {error && <div className="parse-error">{error}</div>}
                <div>{'Original row: ' + rowInfo.original.raw}</div>
              </div>
            );
          }
        }}
        defaultPageSize={50}
        showPagination={false}
        sortable={false}
      />
    );
  }
}
