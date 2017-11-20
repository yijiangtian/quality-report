"""
Copyright 2012-2017 Ministerie van Sociale Zaken en Werkgelegenheid

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

import datetime
import unittest
from unittest.mock import patch
from unittest.mock import MagicMock
from hqlib import domain

class MetricSourceAgeMetricUnderTest(domain.MetricSourceAgeMetric):
    """ Implement abstract methods. """
    metric_source_class = domain.MetricSource

class MetricSourceAgeMetricTest(unittest.TestCase):
    """ Test case for the metric source age metric. """

    def setUp(self):
        self.__metric_source = domain.MetricSource()
        self.__subject = domain.Product(name='Product', metric_source_ids={self.__metric_source: 'http://url'})
        self.__project = domain.Project(metric_sources={domain.MetricSource: self.__metric_source})
        self.__metric = MetricSourceAgeMetricUnderTest(self.__subject, project=self.__project)

    @patch.object(domain.MetricSourceAgeMetric, '_missing')
    def test_value(self, missing_mock):
        """ Test the value of the metric, for current date and time. """
        missing_mock.return_value = False
        self._MetricSourceAgeMetricTest__metric_source.datetime = MagicMock(return_value=datetime.datetime.now())

        result = self.__metric.value()

        assert missing_mock.called
        assert self._MetricSourceAgeMetricTest__metric_source.datetime.assert_called_once
        self.assertEqual(0, result)

    @patch.object(domain.MetricSourceAgeMetric, '_missing')
    def test_value_missing_metric(self, missing_mock):
        """ Test the value, when the age metric is missing. """
        missing_mock.return_value = True
        self._MetricSourceAgeMetricTest__metric_source.datetime = MagicMock()

        result = self.__metric.value()

        assert missing_mock.called
        assert self._MetricSourceAgeMetricTest__metric_source.datetime.assert_not_called
        self.assertEqual(-1, result)

    @patch.object(domain.MetricSourceAgeMetric, '_missing')
    def test_value_after(self, missing_mock):
        """ Test the value, when the age of the metric is two days. """

        missing_mock.return_value = False
        self._MetricSourceAgeMetricTest__metric_source.datetime = \
            MagicMock(return_value=datetime.datetime.now() - datetime.timedelta(2))
        result = self.__metric.value()

        assert missing_mock.called
        assert self._MetricSourceAgeMetricTest__metric_source.datetime.assert_called_once
        self.assertEqual(2, result)

    @patch.object(domain.MetricSourceAgeMetric, '_missing')
    def test_value_before(self, missing_mock):
        """ Test the value, when the age of the metric appears to be negative (by server time out of sync). """

        missing_mock.return_value = False

        self._MetricSourceAgeMetricTest__metric_source.datetime = \
            MagicMock(return_value=datetime.datetime.now() + datetime.timedelta(seconds=5))

        result = self.__metric.value()

        assert missing_mock.called
        assert self._MetricSourceAgeMetricTest__metric_source.datetime.assert_called_once
        self.assertEqual(0, result)

    def test_status(self):
        """ Test that the default status is perfect. """
        self.assertEqual('perfect', self.__metric.status())

    def test_missing_source(self):
        """ Test that the status is missing_source if the project has no metric source. """
        metric = MetricSourceAgeMetricUnderTest(self.__subject, project=domain.Project())
        self.assertEqual('missing_source', metric.status())

    def test_value_with_missing_source(self):
        """ Test that the status is missing_source if the project has no metric source. """
        metric = MetricSourceAgeMetricUnderTest(self.__subject,
                                                project=domain.Project(metric_sources={domain.MetricSource: None}))
        self.assertEqual(-1, metric.value())

    def test_missing_metric_source_id(self):
        """ Test that the status is missing_source if the subject has no metric source id. """
        metric = MetricSourceAgeMetricUnderTest(domain.Product(name='Product'), project=self.__project)
        old_need_metric_source_id = metric.metric_source_class.needs_metric_source_id
        metric.metric_source_class.needs_metric_source_id = True
        result = metric.status()
        metric.metric_source_class.needs_metric_source_id = old_need_metric_source_id

        self.assertEqual('missing_source', result)

    def test_norm_template_default_values(self):
        """ Test that the right values are returned to fill in the norm template. """
        self.assertTrue(MetricSourceAgeMetricUnderTest.norm_template %
                        MetricSourceAgeMetricUnderTest.norm_template_default_values())

    @patch.object(domain.Metric, '_metric_source_urls')
    def test_url(self, metric_source_urls_mock):
        """ Test that the url of the metric equals the metric source id. """

        metric_source_urls_mock.return_value = ['http://url']
        self.assertEqual({domain.MetricSource.metric_source_name: 'http://url'}, self.__metric.url())

    def test_report(self):
        """ Test the metric report. """
        self.assertEqual('Subclass responsibility', self.__metric.report())

    def test_norm(self):
        """ Test that the norm is correct. """
        self.assertEqual('Subclass responsibility', self.__metric.norm())
