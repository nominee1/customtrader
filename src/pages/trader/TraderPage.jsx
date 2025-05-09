import { 
    Button, 
    Divider, 
    Layout, 
    Typography, 
    Row, 
    Col 
} from 'antd';
import {
    LineChartOutlined,
    RiseOutlined,
    NumberOutlined,
    ArrowUpOutlined
} from '@ant-design/icons';
import { useState, useEffect, useMemo } from 'react';
import OverUnderTrader from './over_under/OverUnderContract';
import EvenOddTrader from './even_odd/EvenOddContract';
import RiseFallTrader from './rise_fall/RiseFallContract';
import MatchesDiffersTrader from './matches_differs/MatchesDifferContract';
import RiseFallMarketAnalysis from '../analysis/riseFall/RiseFallMarketAnalysis';
import OverUnderMarketAnalysis from '../analysis/overUnder/OverUnderMarketAnalysis';
import MatchesDiffersMarketAnalysis from '../analysis/matchesDiffers/MatchesDiffersMarketAnalysis';
import EvenOddMarketAnalysis from '../analysis/evenOdd/EvenOddMarketAnalysis';
import RecentTrades from '../../components/RecentTrades';
import ChartPage from './ChartPage';
const { Title, Text } = Typography;

const TraderPage = () => {
    const [selectedFeature, setSelectedFeature] = useState(null);

    const features = useMemo(() => [
        {
          icon: <RiseOutlined />,
          title: 'Rise/Fall',
          contractComponent: <RiseFallTrader />,
          analysisComponent: <RiseFallMarketAnalysis />
        },
        {
          icon: <NumberOutlined />,
          title: 'Even/Odd',
          contractComponent: <EvenOddTrader />,
          analysisComponent: <EvenOddMarketAnalysis />
        },
        {
          icon: <ArrowUpOutlined />,
          title: 'Over/Under',
          contractComponent: <OverUnderTrader />,
          analysisComponent: <OverUnderMarketAnalysis />
        },
        {
          icon: <LineChartOutlined />,
          title: 'Matches/Differs',
          contractComponent: <MatchesDiffersTrader />,
          analysisComponent: <MatchesDiffersMarketAnalysis />
        }
    ], []);

    // Set default feature to "Rise/Fall" on initial render
    useEffect(() => {
        setSelectedFeature(features[0]); 
    }, [features]);

    return (
        <Layout style={{ padding: '16px' }}>
            <Layout.Content>
                {/* Chart at the top */}
                <ChartPage />

                {/* Trading Features */}
                <Divider orientation="center">
                    <Title level={2}>Our Trading Options</Title>
                </Divider>
                <Row gutter={[16, 16]} justify="center" style={{ marginBottom: 60 }}>
                    {features.map((feature, index) => (
                        <Col key={index}>
                            <Button
                                type={selectedFeature === feature ? 'primary' : 'default'}
                                icon={feature.icon}
                                size="large"
                                onClick={() => setSelectedFeature(feature)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 8,
                                    padding: '8px 10px',
                                    minWidth: 150,
                                    textAlign: 'center',
                                }}
                            >
                                <div>
                                    <Title level={5} style={{ margin: 0 }}>{feature.title}</Title>
                                    <Text type="secondary">{feature.description}</Text>
                                </div>
                            </Button>
                        </Col>
                    ))}
                </Row>

                {/* Trading Contract Section */}
                <Divider orientation="center">
                    <Title level={2}>Trading Contract</Title>  
                </Divider>
                <Row gutter={[16, 16]} style={{ marginTop: 10 }}>
                    {selectedFeature ? (
                        <>
                            <Col xs={24} md={12}>
                                <div style={{ resize: 'horizontal', overflow: 'auto', paddingRight: 8 }}>
                                    {selectedFeature.contractComponent}
                                </div>
                            </Col>
                            <Col xs={24} md={12}>
                                <div style={{ overflow: 'auto', paddingLeft: 8 }}>
                                    {selectedFeature.analysisComponent}
                                </div>
                            </Col>
                        </>
                    ) : (
                        <Col span={24}>
                            <Text>Select a trading option to view its contract and analysis.</Text>
                        </Col>
                    )}
                </Row>

                <Divider orientation="center">
                    <Title level={2}>Recent Trades</Title>
                </Divider>
                <RecentTrades />
            </Layout.Content>
        </Layout>
    );
};

export default TraderPage;