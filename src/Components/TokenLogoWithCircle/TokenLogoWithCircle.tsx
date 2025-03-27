import { Fragment } from 'react';
// import styles from './TokenLogoWithCircle.module.scss';
import classNames from 'classnames';
import { getFallbackImageLetters, getUrlForImage, hexToStr, isTokenADA, isValidHexColor, isValidUrl } from '../../Commons/index.js';

// function classNames(...args: (string | Record<string, boolean> | undefined | null | false)[]): string {
//     return args
//         .flatMap((arg) => {
//             if (!arg) return [];
//             if (typeof arg === 'string') return [arg];
//             if (typeof arg === 'object')
//                 return Object.entries(arg)
//                     .filter(([_, val]) => val)
//                     .map(([key]) => key);
//             return [];
//         })
//         .join(' ');
// }

interface ITokenLogoProps {
    token: {
        CS: string;
        TN_Hex: string;
        ticker?: string;
        image?: string;
        colorHex?: string;
        percentage?: bigint;
    };
    showBorder?: boolean;
    width?: number;
    height?: number;
    className?: string;
    style?: React.CSSProperties;
}

const TokenLogo: React.FC<ITokenLogoProps> = ({ token, showBorder = true, width = 22, height = 22, className, style }) => {
    //--------------------------------------
    // Adjust size if border is enabled
    const circleWidth = Math.round(width * 1.8);
    const circleHeight = Math.round(height * 1.8);
    //--------------------------------------
    const colorHex = token.colorHex !== undefined && isValidHexColor(token.colorHex) ? token.colorHex : '#000000';
    const percentage = token.percentage !== undefined ? token.percentage : 100n;
    const ticker = token.ticker ?? hexToStr(token.TN_Hex);
    const tokenName = isTokenADA(token.CS, token.TN_Hex) ? `` : ` [${hexToStr(token.TN_Hex)}]`;
    //--------------------------------------
    return (
        <Fragment>
            <div
                className={classNames('TokenLogo-logo', className)}
                style={{
                    width: `${width}px`,
                    height: `${width}px`,
                    ...style, // Allow custom styles
                }}
                title={`${ticker}${tokenName}`}
            >
                <div className={'TokenLogo-tokenLogo'}>
                    {token.image && isValidUrl(token.image) ? (
                        <img
                            src={getUrlForImage(token.image)}
                            alt={ticker}
                            title={`${ticker}${tokenName}`}
                            className={'TokenLogo-tokenImage'}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    ) : (
                        <div
                            className={'TokenLogo-tokenImageFallback'}
                            title={`${ticker}${tokenName}`}
                            style={{
                                borderColor: colorHex,
                            }}
                        >
                            <div
                                className={'TokenLogo-tokenImageFallbackText'}
                                style={{
                                    color: colorHex,
                                    fontSize: `${width * 0.5}px`, // Dynamically scales font size
                                }}
                            >
                                {getFallbackImageLetters(token)}
                            </div>
                        </div>
                    )}
                </div>

                {showBorder && (
                    <div
                        className={'TokenLogo-border'}
                        title={`${ticker}${tokenName}`}
                        style={{
                            width: `${circleWidth}px`,
                            height: `${circleHeight}px`,
                        }}
                    >
                        <svg className={'TokenLogo-fill'} style={{ stroke: `${colorHex}` }}>
                            <circle
                                r="16"
                                cx="50%"
                                cy="50%"
                                pathLength="100"
                                style={{
                                    fill: 'none',
                                    stroke: '#636363', // Background circle color
                                    strokeWidth: '4',
                                }}
                            />
                            <circle
                                r="16"
                                cx="50%"
                                cy="50%"
                                pathLength={100}
                                style={{
                                    strokeDasharray: `${percentage} 100`,
                                }}
                            />
                        </svg>
                    </div>
                )}
            </div>
        </Fragment>
    );
};

export default TokenLogo;
