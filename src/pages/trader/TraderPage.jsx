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
import VolatilityComparisonChart from '../../components/TickDataGraph';
import MatchesDiffersTrader from './matches_differs/MatchesDifferContract';

const { Title, Text } = Typography;

const TraderPage = () => {
    const [selectedFeature, setSelectedFeature] = useState(null);

    const features = useMemo(() => [
        {
          icon: <RiseOutlined />,
          title: 'Rise/Fall',
          component: <RiseFallTrader />
        },
        {
          icon: <NumberOutlined />,
          title: 'Even/Odd',
          component: <EvenOddTrader />
        },
        {
          icon: <ArrowUpOutlined />,
          title: 'Over/Under',
          component: <OverUnderTrader />
        },
        {
          icon: <LineChartOutlined />,
          title: 'Matches/Differs',
          component: <MatchesDiffersTrader />
        }
    ], []);

    // Set default feature to "Rise/Fall" on initial render
    useEffect(() => {
        setSelectedFeature(features[0]); 
    }, [features]);

    return (
        <Layout style={{ padding: '24px' }}>
            <Layout.Content>
                {/* Chart at the top */}
                <VolatilityComparisonChart />

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
                                    padding: '10px 16px',
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
                <div style={{ marginTop: 24 }}>
                    {selectedFeature ? (
                        selectedFeature.component || <Text>No contract available for this option.</Text>
                    ) : (
                        <Text>Select a trading option to view its contract.</Text>
                    )}
                </div>
            </Layout.Content>
        </Layout>
    );
};

export default TraderPage;