import React, { useEffect, useState } from 'react';
import { Card, Space, Typography, Row, Col, Tag, Progress } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { useUser } from '../context/AuthContext';
import { useContracts } from '../context/ContractsContext';
import '../assets/css/components/RecentTrade.css';

const { Text } = Typography;

const RecentTrades = () => {
  const { activeAccount, authLoading, sendAuthorizedRequest } = useUser();
  const { activeContracts, updateContract, removeContract } = useContracts();
  const [recentTrades, setRecentTrades] = useState([]);
  const [liveContracts, setLiveContracts] = useState([]);
  const [trackingIds, setTrackingIds] = useState(new Set());

  const accountId = activeAccount?.loginid;

  useEffect(() => {
    const cachedRecentTrades = localStorage.getItem(`recentTrades_${accountId}`);
    if (cachedRecentTrades) {
      setRecentTrades(JSON.parse(cachedRecentTrades));
    }
  }, [accountId]);

  useEffect(() => {
    const subscriptions = [];

    const subscribeToLiveContracts = async () => {
      if (!activeContracts.length) return;

      for (const contract of activeContracts) {
        const payload = {
          proposal_open_contract: 1,
          contract_id: contract.contract_id,
          subscribe: 1,
        };

        try {
          sendAuthorizedRequest(payload).then((response) => {
            if (response.error) return;

            const contractData = response.proposal_open_contract;
            if (!contractData) return;

            // ✅ If contract is no longer open, handle transition immediately
            if (contractData.status !== 'open') {
              setLiveContracts((prev) =>
                prev.filter((c) => c.contract_id !== contractData.contract_id)
              );
              setRecentTrades((prev) => {
                const exists = prev.some((t) => t.contract_id === contractData.contract_id);
                if (exists) return prev;
                const updatedTrades = [contractData, ...prev].slice(0, 20);
                localStorage.setItem(`recentTrades_${accountId}`, JSON.stringify(updatedTrades));
                return updatedTrades;
              });
              removeContract(contractData.contract_id);
              setTrackingIds((prev) => {
                const updated = new Set(prev);
                updated.delete(contractData.contract_id);
                return updated;
              });
              return;
            }

            if (contractData.status === 'open') {
              setLiveContracts((prev) => {
                const exists = prev.some((c) => c.contract_id === contractData.contract_id);
                const updated = exists
                  ? prev.map((c) =>
                      c.contract_id === contractData.contract_id ? contractData : c
                    )
                  : [contractData, ...prev].slice(0, 20);
                return updated;
              });
            }

            if (contractData.contract_type === 'ACCU' && contractData.status === 'open') {
              setTrackingIds(prev => new Set(prev).add(contractData.contract_id));
            } else {
              setTrackingIds(prev => {
                const updated = new Set(prev);
                updated.delete(contractData.contract_id);
                return updated;
              });
            }

            updateContract(contractData.contract_id, {
              status: contractData.status,
              details: {
                ...contractData,
                entry_tick: contractData.entry_spot || null,
                exit_tick: contractData.exit_spot || null,
              },
            });
          });
        } catch (error) {
          console.error('Error subscribing to live contract:', error);
        }
      }

      return () => {
        subscriptions.forEach((unsubscribe) => {
          if (typeof unsubscribe === 'function') unsubscribe();
        });
      };
    };

    if (activeContracts.length > 0) {
      subscribeToLiveContracts();
    }

    return () => {
      subscriptions.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') unsubscribe();
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContracts, sendAuthorizedRequest, updateContract, removeContract]);
  
  // Helper function to determine tick frequency for ACCU contracts
  const isOneSecondSymbol = (symbol) => symbol && symbol.startsWith('1HZ');

  // Update live ACCU contract growth every second
  useEffect(() => {
    if (!liveContracts.length) return;
    // Only update contracts with contract_type === 'ACCU'
    const interval = setInterval(() => {
      setLiveContracts((prevContracts) =>
        prevContracts.map((contract) => {
          if (!trackingIds.has(contract.contract_id)) return contract;
          if (
            contract.contract_type === 'ACCU' &&
            contract.date_start &&
            contract.growth_rate != null &&
            contract.buy_price != null
          ) {
            const secondsPerTick = isOneSecondSymbol(contract.underlying) ? 1 : 2;
            const ticksElapsed = Math.floor((Date.now() / 1000 - contract.date_start) / secondsPerTick);
            const growthFactor = Math.pow(1 + contract.growth_rate, ticksElapsed);
            const estValue = contract.buy_price * growthFactor;
            const growthPercentage = ((estValue - contract.buy_price) / contract.buy_price) * 100;
            return {
              ...contract,
              _live_growth_percentage: growthPercentage,
              _live_est_value: estValue,
            };
          }
          return contract;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [liveContracts, trackingIds]);

  const handleSell = async (contract_id) => {
    try {
      const payload = {
        sell: contract_id,
        price: 0, 
      };
      const response = await sendAuthorizedRequest(payload);
      if (response.error) throw new Error(response.error.message);
      console.log('Sell response', response);
      setTrackingIds(prev => {
        const updated = new Set(prev);
        updated.delete(contract_id);
        return updated;
      });
    } catch (err) {
      console.error('Sell failed:', err);
    }
  };

  const calculateProgress = (contract) => {
    if (contract.duration_unit === 't') {
      const totalTicks = contract.duration;
      const elapsedTicks = contract.tick_count || 0;
    return Math.round(Math.min((elapsedTicks / totalTicks) * 100, 100));
    }
    if (!contract.date_start || !contract.date_expiry) return 0;
    const now = Date.now() / 1000;
    const totalDuration = contract.date_expiry - contract.date_start;
    const elapsed = now - contract.date_start;
    return Math.round(Math.min((elapsed / totalDuration) * 100, 100));
  };

  const sortedRecentTrades = [...recentTrades].sort(
    (a, b) => b.date_start - a.date_start
  );
  const sortedLiveContracts = [...liveContracts].sort(
    (a, b) => b.date_start - a.date_start
  );

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Row gutter={16} wrap>
        <Col xs={24} md={12}>
          <div style={{ overflow: 'auto', padding: 8 }}>
            <Card
              title={
                <Space>
                  <HistoryOutlined style={{ color:'var(--text-color)'}}/>
                  <Text strong>Live Contracts</Text>
                </Space>
              }
              style={{
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                minWidth: 300,
              }}
              loading={authLoading}
            >
              {sortedLiveContracts.length > 0 ? (
                <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    {sortedLiveContracts.map((contract) => (
                      <Card
                        key={contract.contract_id}
                        size="small"
                        style={{ borderLeft: '4px solid #1890ff', borderRadius: 8 }}
                      >
                        <Row justify="space-between">
                          <Col>
                            <Text strong>{contract.display_name || contract.underlying}</Text> <br />
                            <Text type="secondary" style={{ color:'var(--text-color)'}}>Type: {contract.contract_type}</Text> <br />
                            <Text type="secondary" style={{ color:'var(--text-color)'}}>Buy Price: {contract.buy_price} {contract.currency}</Text> <br />
                            <Text type="secondary" style={{ color:'var(--text-color)'}}>Current Price: {contract.current_spot || 'N/A'}</Text> <br />
                            <Text type="secondary" style={{ color:'var(--text-color)'}}>Profit: {contract.profit || 0} {contract.currency}</Text> <br />
                            {contract.contract_type === 'ACCU' ? (
                              <Text type="secondary" style={{ color:'var(--text-color)'}}>
                                Growth Rate: {(contract.growth_rate * 100).toFixed(2)}%
                              </Text>
                            ) : (
                              <Text type="secondary" style={{ color:'var(--text-color)'}}>
                                Pay Out: {contract.payout || 0}{contract.currency}
                              </Text>
                            )} <br />
                            <Text type="secondary" style={{ color:'var(--text-color)'}}>
                              Duration: {contract.duration} {contract.duration_unit === 't' ? 'ticks' : 'minutes'}
                            </Text> <br />
                            {contract.contract_type === 'ACCU' ? (
                              <>
                                <Text type="success">
                                  📈 {contract._live_growth_percentage?.toFixed(2)}% (Est. ${contract._live_est_value?.toFixed(2)})
                                </Text>
                                {contract.contract_type === 'ACCU' && (
                                  <button
                                    style={{
                                      marginTop: 8,
                                      padding: '6px 12px',
                                      fontSize: 14,
                                      backgroundColor: '#722ed1',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: 4,
                                      cursor: 'pointer',
                                      width: '100%',
                                    }}
                                    onClick={() => handleSell(contract.contract_id)}
                                  >
                                    Sell
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <Progress
                                  percent={calculateProgress(contract)}
                                  size="small"
                                  status="active"
                                  style={{ width: 150 }}
                                />
                              </>
                            )}
                          </Col>
                          <Col>
                            <Tag color={
                              contract.status === 'sold' ? 'purple' :
                              contract.status === 'open' ? 'blue' :
                              'red'
                            }>
                              {contract.status === 'sold' ? 'SOLD' : contract.status?.toUpperCase()}
                            </Tag>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                  </Space>
                </div>
              ) : (
                <Text type="secondary" style={{ color:'var(--text-color)'}}>No live contracts.</Text>
              )}
            </Card>
          </div>
        </Col>

        <Col xs={24} md={12}>
          <div style={{ overflow: 'auto', padding: 8 }}>
            <Card
              title={
                <Space>
                  <HistoryOutlined style={{ color:'var(--text-color)'}}/>
                  <Text strong>Recent Trades</Text>
                </Space>
              }
              style={{
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                minWidth: 300
              }}
              loading={authLoading}
            >
              <div className="custom-scrollbar" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {sortedRecentTrades.length > 0 ? (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    {sortedRecentTrades.map((trade) => (
                      <Card
                        key={trade.contract_id}
                        size="small"
                        style={{
                          borderLeft: `4px solid ${trade.profit > 0 ? '#52c41a' : '#ff4d4f'}`,
                          borderRadius: 8,
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <Row justify="space-between">
                          <Col>
                            <Text strong>{trade.display_name || trade.underlying}</Text> <br />
                            <Text type="secondary" style={{ color:'var(--text-color)'}}>Type: {trade.contract_type}</Text> <br />
                            <Text type="secondary" style={{ color:'var(--text-color)'}}>Buy Price: {trade.buy_price} {trade.currency}</Text> <br />
                            <Text type="secondary" style={{ color:'var(--text-color)'}}>Sell Price: {trade.sell_price || 'N/A'}</Text> <br />
                            <Text type="secondary" style={{ color:'var(--text-color)'}}>Profit: {trade.profit || 0} {trade.currency}</Text> <br />
                            {trade.contract_type === 'ACCU' ? (
                              <Text type="secondary" style={{ color: 'var(--text-color)' }}>
                                Growth Rate: {(trade.growth_rate * 100).toFixed(2)}%
                              </Text>
                            ) : (
                              <Text type="secondary" style={{ color: 'var(--text-color)' }}>
                                Pay Out: {trade.payout || 0} {trade.currency}
                              </Text>
                            )}
                          </Col>
                          <Col>
                            <Tag color={trade.profit > 0 ? 'green' : 'red'}>
                              {trade.profit > 0 ? 'WON' : 'LOST'}
                            </Tag>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary" style={{ color:'var(--text-color)'}}>No recent trades available.</Text>
                )}
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </Space>
  );
};

export default RecentTrades;